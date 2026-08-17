import { getServerSession } from "#auth";
import ExcelJS from "exceljs";
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, TextRun, BorderStyle,
} from "docx";

/**
 * Excel and Word downloads, from the same report definition the preview uses.
 *
 * No PDF here on purpose. jspdf is installed but ships no Khmer glyphs, so a
 * generated PDF comes out as boxes — the reason every ទម្រង់ prints through
 * window.print() and the shared @media print stylesheet instead. The page offers
 * PDF as "print the preview", which produces a correct Khmer document through
 * the browser's own Save as PDF.
 *
 * Khmer in both formats needs the font named explicitly: Office picks a Latin
 * default otherwise and Khmer falls back inconsistently between machines. Named
 * here, Word and Excel substitute a Khmer face when the exact one is absent
 * rather than dropping to something that cannot render the script at all.
 */
const KH_FONT = "Khmer OS";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  const body = await readBody(event);
  const def = findReport(body?.type);
  if (!def) {
    throw createError({ statusCode: 400, statusMessage: "Unknown report type" });
  }
  const format = body?.format;
  if (format !== "xlsx" && format !== "docx") {
    throw createError({ statusCode: 400, statusMessage: "format must be xlsx or docx" });
  }

  const filters: ReportFilters = {
    dateFrom: body?.dateFrom || null,
    dateTo: body?.dateTo || null,
    centreId: body?.centreId || null,
    provinceCode: body?.provinceCode || null,
  };

  try {
    const prisma = event.context.prisma;
    const rows = await def.run(prisma, filters);

    // Named for the header line, not looked up twice.
    const centreName = filters.centreId
      ? (await prisma.serviceCenter.findUnique({
          where: { id: filters.centreId },
          select: { nameKH: true },
        }))?.nameKH ?? null
      : null;

    const subtitle = describeFilters(filters, centreName);
    const stamp = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      wb.creator = "SWIMS";
      wb.created = new Date();
      const ws = wb.addWorksheet(def.key);

      const lastCol = def.columns.length;
      const merge = (r: number) => ws.mergeCells(r, 1, r, lastCol);

      ws.addRow([def.title]);
      merge(1);
      ws.getCell(1, 1).font = { name: KH_FONT, size: 14, bold: true };
      ws.getCell(1, 1).alignment = { horizontal: "center" };

      ws.addRow([subtitle]);
      merge(2);
      ws.getCell(2, 1).font = { name: KH_FONT, size: 10 };
      ws.getCell(2, 1).alignment = { horizontal: "center" };

      ws.addRow([`បង្កើតនៅ ${stamp} · ចំនួន ${rows.length} កំណត់ត្រា`]);
      merge(3);
      ws.getCell(3, 1).font = { name: KH_FONT, size: 9, color: { argb: "FF6B7280" } };
      ws.getCell(3, 1).alignment = { horizontal: "center" };

      ws.addRow([]);

      const head = ws.addRow(def.columns.map((c) => c.label));
      head.eachCell((cell) => {
        cell.font = { name: KH_FONT, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } };
      });
      head.height = 28;

      for (const r of rows) {
        const line = ws.addRow(
          def.columns.map((c) => {
            const v = r[c.key];
            // Numbers as numbers, so Excel can total a column.
            if (c.numeric && typeof v === "number") return v;
            if (c.numeric && v !== "—" && v !== "" && v !== null && !Number.isNaN(Number(v))) return Number(v);
            return v ?? "—";
          })
        );
        line.eachCell((cell, i) => {
          cell.font = { name: KH_FONT, size: 10 };
          cell.alignment = {
            vertical: "top",
            horizontal: def.columns[i - 1]?.numeric ? "right" : "left",
            wrapText: true,
          };
        });
      }

      def.columns.forEach((c, i) => { ws.getColumn(i + 1).width = c.width ?? 18; });
      // Header stays visible while an official scrolls a long register.
      ws.views = [{ state: "frozen", ySplit: 5 }];
      ws.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: 5, column: lastCol },
      };

      const buffer = await wb.xlsx.writeBuffer();
      setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      setHeader(event, "Content-Disposition", `attachment; filename="${reportFilename(def, "xlsx")}"`);
      return Buffer.from(buffer);
    }

    // ------------------------------------------------------------------ docx
    const cell = (text: string, opts: { bold?: boolean; right?: boolean } = {}) =>
      new TableCell({
        children: [
          new Paragraph({
            alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
            children: [new TextRun({ text: String(text ?? "—"), font: KH_FONT, size: 18, bold: opts.bold })],
          }),
        ],
        shading: opts.bold ? { fill: "16A34A" } : undefined,
      });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: def.columns.map((c) =>
            new TableCell({
              shading: { fill: "16A34A" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: c.label, font: KH_FONT, size: 18, bold: true, color: "FFFFFF" })],
                }),
              ],
            })
          ),
        }),
        ...rows.map((r) =>
          new TableRow({
            children: def.columns.map((c) => cell(r[c.key], { right: c.numeric })),
          })
        ),
      ],
    });

    const doc = new Document({
      creator: "SWIMS",
      title: def.title,
      sections: [
        {
          // Landscape: these registers are wider than they are tall.
          properties: { page: { size: { orientation: "landscape" as any } } },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: def.title, font: KH_FONT, size: 32, bold: true })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: subtitle, font: KH_FONT, size: 20 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: `បង្កើតនៅ ${stamp} · ចំនួន ${rows.length} កំណត់ត្រា`,
                  font: KH_FONT, size: 16, color: "6B7280",
                }),
              ],
            }),
            rows.length
              ? table
              : new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "គ្មានទិន្នន័យសម្រាប់លក្ខខណ្ឌនេះទេ", font: KH_FONT, size: 20 })],
                }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    setHeader(event, "Content-Disposition", `attachment; filename="${reportFilename(def, "docx")}"`);
    return buffer;
  } catch (e: any) {
    if (e?.statusCode) throw e;
    console.error("[report/export]", def.key, format, e);
    throw createError({ statusCode: 500, statusMessage: "មិនអាចបង្កើតឯកសារបានទេ" });
  }
});

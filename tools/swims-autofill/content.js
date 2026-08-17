/**
 * SWIMS Autofill — the filler.
 *
 * The whole difficulty is that this app is Vue 3 with three different kinds of
 * control, and each needs a different technique. Setting `.value` works for
 * some and is silently ignored by others, which is why a naive autofiller fills
 * a form that then saves as empty. What is here was arrived at by driving these
 * exact widgets:
 *
 *   plain input / textarea   set .value, then dispatch input + change.
 *   native <select>          set .value, then dispatch change.
 *   radio / checkbox         .click(). Setting .checked and dispatching change
 *                            does NOT reliably update an array v-model — a
 *                            multi-select group ends up with one entry instead
 *                            of the several that appear ticked on screen.
 *   @vuepic/vue-datepicker   typing is ignored entirely. The menu has to be
 *                            opened and a day cell clicked. Any menu already
 *                            open must be closed first or the click toggles it
 *                            shut instead of choosing.
 *   vue3-tailwind TwSelect   a custom dropdown, not a <select>: click the
 *                            trigger, then click an option in the panel.
 *
 * Uploads are opt-in and synthesise a tiny real file, because the server checks
 * the MIME type and rejects anything outside its allowlist.
 */
(() => {
  const { valueFor, pick, TAG } = window.__SWIMS_AUTOFILL_DATA__;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) =>
    !!el && !el.disabled && !el.readOnly && el.offsetParent !== null &&
    getComputedStyle(el).visibility !== "hidden";

  /** What the field is asking for, in the user's own words where possible. */
  function hintFor(el) {
    const bits = [];
    const label = el.closest("label");
    if (label) bits.push(label.textContent);
    if (el.id) {
      const forLabel = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (forLabel) bits.push(forLabel.textContent);
    }
    // The wrapped components put their caption in a sibling above the control.
    const wrap = el.closest("div");
    if (wrap) {
      const cap = wrap.querySelector("label, span, p");
      if (cap && !cap.contains(el)) bits.push(cap.textContent);
    }
    bits.push(el.getAttribute("aria-label"), el.placeholder, el.name, el.id);
    return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").slice(0, 160);
  }

  const setNative = (el, value) => {
    // Assign through the prototype setter so Vue's listener sees a real change.
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter ? setter.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const closeAnyDatepicker = async () => {
    if (document.querySelector(".dp__menu, .dp--menu-wrapper")) {
      document.body.click();
      await sleep(120);
      if (document.querySelector(".dp__menu, .dp--menu-wrapper")) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await sleep(120);
      }
    }
  };

  async function fillDatepicker(input) {
    await closeAnyDatepicker();
    input.click();
    await sleep(260);
    const menu = document.querySelector(".dp__menu, .dp--menu-wrapper");
    if (!menu) return false;
    const cells = [...menu.querySelectorAll(".dp__cell_inner")]
      .filter((c) => /^\d+$/.test(c.textContent.trim()) && !/offset|disabled/.test(c.className));
    if (!cells.length) { await closeAnyDatepicker(); return false; }
    // Mid-month, so a "must not be in the future" rule is unlikely to reject it.
    pick(cells.slice(0, Math.min(cells.length, 27))).click();
    await sleep(200);
    document.querySelector(".dp__action_select")?.click();
    await sleep(120);
    await closeAnyDatepicker();
    return true;
  }

  /** vue3-tailwind's TwSelect: a button-ish trigger with a panel of options. */
  async function fillCustomSelect(trigger) {
    trigger.click();
    await sleep(220);
    const panel = document.querySelector('[role="listbox"], .vt-absolute, ul[class*="absolute"]');
    const opts = panel
      ? [...panel.querySelectorAll('li, [role="option"]')].filter((o) => o.textContent.trim())
      : [];
    if (!opts.length) { document.body.click(); return false; }
    pick(opts).click();
    await sleep(150);
    return true;
  }

  function makeFile() {
    // A real PNG header: the endpoint sniffs the MIME type and refuses the rest.
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return new File([bytes], "autofill-test.png", { type: "image/png" });
  }

  async function run(opts) {
    const report = { text: 0, textarea: 0, select: 0, radio: 0, checkbox: 0, date: 0, custom: 0, file: 0, skipped: 0 };
    const already = (el) => String(el.value ?? "").trim().length > 0;

    // --- dates first: their menus overlay everything else ---------------------
    for (const dp of [...document.querySelectorAll("input.dp__input")]) {
      if (!visible(dp)) continue;
      if (!opts.overwrite && already(dp)) { report.skipped++; continue; }
      if (await fillDatepicker(dp)) report.date++;
    }

    // --- plain text, textarea, number, email ---------------------------------
    for (const el of [...document.querySelectorAll("input, textarea")]) {
      if (!visible(el)) continue;
      const type = (el.type || "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "range", "color"].includes(type)) continue;
      if (["radio", "checkbox", "file"].includes(type)) continue;
      if (el.classList.contains("dp__input")) continue;          // handled above
      if (/search|ស្វែងរក/i.test(hintFor(el))) { report.skipped++; continue; }
      if (!opts.overwrite && already(el)) { report.skipped++; continue; }

      setNative(el, valueFor(hintFor(el), type));
      el.tagName === "TEXTAREA" ? report.textarea++ : report.text++;
      await sleep(12);
    }

    // --- native selects -------------------------------------------------------
    for (const sel of [...document.querySelectorAll("select")]) {
      if (!visible(sel)) continue;
      // Skip the placeholder option, which is usually the empty first entry.
      const choices = [...sel.options].filter((o) => o.value !== "" && !o.disabled);
      if (!choices.length) { report.skipped++; continue; }
      if (!opts.overwrite && sel.value) { report.skipped++; continue; }
      sel.value = pick(choices).value;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      report.select++;
      await sleep(30);
    }

    // --- radios: one per group ------------------------------------------------
    const groups = new Map();
    for (const r of [...document.querySelectorAll('input[type="radio"]')]) {
      if (!visible(r)) continue;
      const key = r.name || hintFor(r).slice(0, 40);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    for (const [, members] of groups) {
      if (!opts.overwrite && members.some((m) => m.checked)) { report.skipped++; continue; }
      pick(members).click();
      report.radio++;
      await sleep(30);
    }

    // --- checkboxes: a random subset, never none ------------------------------
    const boxes = [...document.querySelectorAll('input[type="checkbox"]')].filter(visible);
    for (const b of boxes) {
      // ~45% each, so multi-selects get a realistic spread rather than all-on.
      const want = Math.random() < 0.45;
      if (want !== b.checked) { b.click(); await sleep(25); }
      report.checkbox++;
    }

    // --- custom dropdowns that are not <select> ------------------------------
    for (const t of [...document.querySelectorAll('[role="combobox"], .vt-select__trigger')]) {
      if (!visible(t)) continue;
      if (await fillCustomSelect(t)) report.custom++;
    }

    // --- uploads, opt-in ------------------------------------------------------
    if (opts.uploads) {
      for (const f of [...document.querySelectorAll('input[type="file"]')]) {
        if (!f.offsetParent && !f.classList.contains("sr-only")) continue;
        const dt = new DataTransfer();
        dt.items.add(makeFile());
        f.files = dt.files;
        f.dispatchEvent(new Event("change", { bubbles: true }));
        report.file++;
        await sleep(60);
      }
    }

    return report;
  }

  window.__SWIMS_AUTOFILL_RUN__ = run;
})();

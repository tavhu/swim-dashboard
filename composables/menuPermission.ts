import { ALWAYS_ALLOWED_ROUTES } from "~~/shared/appResources";

/**
 * Prunes the sidebar to what the signed-in role may actually open.
 *
 * Leaf links were already filtered, inline in SidebarItem's template, but
 * groups were not — so a role denied every page under មណ្ឌល still saw មណ្ឌល,
 * opened it, and found it empty. Section headings had the same problem: the
 * heading above a fully denied group stayed on screen with nothing under it.
 *
 * Pruning the tree once, here, also puts the rule in one place rather than in a
 * template expression, and lets a group be hidden on the strength of its
 * children — which cannot be decided from inside the child.
 */

export interface MenuNode {
  isTitle?: boolean;
  name: string;
  i18nKey?: string;
  url?: string;
  icon?: string;
  submenu?: MenuNode[];
}

/**
 * A menu url maps to a Nuxt route name the same way the rest of the app does it:
 * `/client/register` → `client-register`, `/` → `index`.
 */
export function routeNameFor(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.split("?")[0].replace(/\/+$/, "");
  if (trimmed === "" || trimmed === "/") return "index";
  return trimmed.replace(/^\//, "").replaceAll("/", "-");
}

/**
 * Whether the current user may open a given menu url.
 *
 * A missing grant denies. That is the opposite of the old behaviour, where a
 * page with no permission row was reachable — which is how most of the app was
 * reachable by everyone, since only nineteen pages had rows at all.
 */
/**
 * Prune a menu tree against a predicate.
 *
 * A group survives if any descendant does. A heading survives if the next
 * surviving node before the following heading is not itself a heading — a
 * heading labels what comes after it, so it goes when what it labels does.
 *
 * Kept free of Nuxt so the rule can be tested directly; useMenuPermission()
 * below supplies the predicate.
 */
export function pruneMenu(
  nodes: MenuNode[],
  canOpen: (url?: string) => boolean
): MenuNode[] {
  const kept: MenuNode[] = [];

  for (const node of nodes) {
    if (node.isTitle) {
      kept.push(node);
      continue;
    }
    if (node.submenu?.length) {
      const submenu = pruneMenu(node.submenu, canOpen);
      if (submenu.length) kept.push({ ...node, submenu });
      continue;
    }
    if (canOpen(node.url)) kept.push(node);
  }

  return kept.filter((node, i) => {
    if (!node.isTitle) return true;
    const next = kept[i + 1];
    return !!next && !next.isTitle;
  });
}

export function useMenuPermission() {
  const permission = useState<any[]>("userPermission");

  const grantFor = (routeName: string | null) => {
    if (!routeName) return null;
    return (
      (permission.value ?? []).find(
        (p: any) => p?.Resource?.frontEndURL === routeName
      ) ?? null
    );
  };

  const canOpen = (url?: string): boolean => {
    const name = routeNameFor(url);
    if (!name) return false;
    // A page nobody needs a grant for still belongs in the menu. The route guard
    // already lets these through; without the same check here the entry was
    // hidden from everyone, since nobody holds a grant for a page that has none.
    if (ALWAYS_ALLOWED_ROUTES.has(name)) return true;
    const g = grantFor(name);
    return !!g && (g.granted === true || g.read === true);
  };

  const prune = (nodes: MenuNode[]) => pruneMenu(nodes, canOpen);

  return { canOpen, prune, routeNameFor };
}

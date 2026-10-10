import type { Category } from "./types";

export interface Tree {
  byId: Map<string, Category>;
  /** Children of each compartment, keyed by parent id (null = top level), sorted by name. */
  children: Map<string | null, Category[]>;
}

const byName = (a: Category, b: Category) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

export function buildTree(categories: Category[]): Tree {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const children = new Map<string | null, Category[]>();
  for (const c of categories) {
    const key = c.parentId !== null && byId.has(c.parentId) ? c.parentId : null;
    const list = children.get(key);
    if (list) list.push(c);
    else children.set(key, [c]);
  }
  for (const list of children.values()) list.sort(byName);
  return { byId, children };
}

export function childrenOf(tree: Tree, id: string | null): Category[] {
  return tree.children.get(id) ?? [];
}

/** Compartments from the top level down to `id`, inclusive. */
export function pathTo(tree: Tree, id: string | null): Category[] {
  const path: Category[] = [];
  const seen = new Set<string>();
  let cur = id === null ? undefined : tree.byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    cur = cur.parentId === null ? undefined : tree.byId.get(cur.parentId);
  }
  return path;
}

/** `id` and every compartment nested anywhere beneath it. */
export function subtreeIds(tree: Tree, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    for (const c of childrenOf(tree, cur)) stack.push(c.id);
  }
  return out;
}

/** True when `id` is `ancestorId` or nested somewhere beneath it. */
export function isWithin(tree: Tree, id: string, ancestorId: string): boolean {
  return pathTo(tree, id).some((c) => c.id === ancestorId);
}

/** Depth-first list for indented pickers. */
export function flatten(tree: Tree): { category: Category; depth: number }[] {
  const out: { category: Category; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of childrenOf(tree, parent)) {
      out.push({ category: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Adds each compartment's descendants' counts into its own. */
export function rollUp(tree: Tree, direct: Record<string, number>): Record<string, number> {
  const total: Record<string, number> = {};
  const visit = (id: string): number => {
    let n = direct[id] ?? 0;
    for (const c of childrenOf(tree, id)) n += visit(c.id);
    total[id] = n;
    return n;
  };
  for (const c of childrenOf(tree, null)) visit(c.id);
  return total;
}

/** "Games › Space shooter › UI", shortened to the last `max` names. */
export function pathLabel(path: Category[], max = 3): string {
  const names = path.map((c) => c.name);
  return names.length > max ? `… › ${names.slice(-max).join(" › ")}` : names.join(" › ");
}

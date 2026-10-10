"use client";

import { useState } from "react";
import { CATEGORY_DRAG, dragging } from "@/lib/drag";
import { COLORS, COLOR_KEYS } from "@/lib/theme";
import { type Tree, childrenOf, flatten, isWithin } from "@/lib/tree";
import type { Category, ColorKey } from "@/lib/types";
import { DropZone } from "./DropZone";

/** "all", "unsorted", or a category id. */
export type Selection = string;

const INDENT = 14;

type Editing = { mode: "edit"; id: string } | { mode: "add"; parentId: string | null } | null;

function rowClass(over: boolean, active: boolean) {
  return `flex items-center rounded-lg transition ${
    over
      ? "bg-sky-200/80 ring-2 ring-sky-400 dark:bg-sky-400/25"
      : active
        ? "bg-white/80 shadow-sm dark:bg-sky-400/10"
        : "hover:bg-white/50 dark:hover:bg-white/5"
  }`;
}

function CountPill({ n, hideOnHover }: { n: number; hideOnHover?: boolean }) {
  return (
    <span
      className={`ml-auto shrink-0 rounded-full bg-sky-100/80 px-2 text-xs tabular-nums text-sky-700 dark:bg-sky-400/10 dark:text-sky-300 ${hideOnHover ? "md:group-hover/row:opacity-0" : ""}`}
    >
      {n}
    </span>
  );
}

function CategoryEditor({
  tree,
  category,
  parentId,
  onSave,
  onDelete,
  onCancel,
}: {
  tree: Tree;
  category?: Category;
  /** For a new compartment: where it will be created. */
  parentId?: string | null;
  onSave: (name: string, color: ColorKey, parentId: string | null) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const initialParent = category ? category.parentId : (parentId ?? null);
  const inheritedColor = initialParent ? tree.byId.get(initialParent)?.color : undefined;
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<ColorKey>(category?.color ?? inheritedColor ?? "ice");
  const [parent, setParent] = useState(initialParent ?? "");
  // Can't move a compartment inside itself or its own sub-compartments.
  const parentOptions = flatten(tree).filter(
    ({ category: c }) => !category || !isWithin(tree, c.id, category.id),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim(), color, parent || null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="frost-card w-64 shrink-0 space-y-2 rounded-lg p-2 md:w-auto"
    >
      {!category && initialParent && (
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          Inside <b>{tree.byId.get(initialParent)?.name}</b>
        </p>
      )}
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={initialParent && !category ? "Sub-compartment name" : "Compartment name"}
        className="w-full rounded-md border border-sky-200 bg-white/90 px-2 py-1 text-sm text-slate-800 outline-none focus:border-sky-400 dark:border-sky-300/15 dark:bg-slate-900/70 dark:text-slate-100"
      />
      <div className="flex flex-wrap gap-1.5">
        {COLOR_KEYS.map((k) => (
          <button
            type="button"
            key={k}
            title={COLORS[k].label}
            aria-label={COLORS[k].label}
            onClick={() => setColor(k)}
            className={`h-5 w-5 rounded-full ${COLORS[k].dot} ${color === k ? "ring-2 ring-sky-700 ring-offset-1 dark:ring-sky-200 dark:ring-offset-slate-900" : ""}`}
          />
        ))}
      </div>
      {category && (
        <label className="block text-xs text-slate-500 dark:text-slate-400">
          Inside
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-sky-200 bg-white/90 px-1 py-1 text-sm text-slate-800 outline-none dark:border-sky-300/15 dark:bg-slate-900/70 dark:text-slate-100"
          >
            <option value="">— Top level —</option>
            {parentOptions.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>
                {"   ".repeat(depth) + c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-center justify-between">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded px-1.5 py-0.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button type="submit" className="ice-button rounded px-2 py-0.5 text-xs font-semibold">
            {category ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

export function Sidebar({
  tree,
  counts,
  selected,
  onSelect,
  onMoveIdea,
  onMoveCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: {
  tree: Tree;
  /** Active idea counts, rolled up so a compartment includes everything nested in it. */
  counts: Record<string, number>;
  selected: Selection;
  onSelect: (s: Selection) => void;
  onMoveIdea: (ideaId: string, categoryId: string | null) => void;
  onMoveCategory: (categoryId: string, parentId: string | null) => void;
  onAddCategory: (name: string, color: ColorKey, parentId: string | null) => void;
  onUpdateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  /** Returns false if the user cancelled. */
  onDeleteCategory: (id: string) => boolean;
}) {
  const [editing, setEditing] = useState<Editing>(null);

  const renderNode = (c: Category, depth: number): React.ReactNode => {
    const kids = childrenOf(tree, c.id);
    const hasKids = kids.length > 0;
    const expanded = hasKids && !c.collapsed;
    const active = selected === c.id;

    if (editing?.mode === "edit" && editing.id === c.id) {
      return (
        <div key={c.id} className="shrink-0" style={{ paddingLeft: depth * INDENT }}>
          <CategoryEditor
            tree={tree}
            category={c}
            onCancel={() => setEditing(null)}
            onSave={(name, color, parentId) => {
              onUpdateCategory(c.id, { name, color, parentId });
              setEditing(null);
            }}
            onDelete={() => {
              if (onDeleteCategory(c.id)) setEditing(null);
            }}
          />
        </div>
      );
    }

    return (
      <div key={c.id} className="shrink-0">
        <div className="group/row relative flex items-center md:block">
          <DropZone
            onIdea={(id) => onMoveIdea(id, c.id)}
            onCategory={(id) => onMoveCategory(id, c.id)}
            acceptsCategory={(id) => !isWithin(tree, c.id, id) && tree.byId.get(id)?.parentId !== c.id}
            onHoverExpand={hasKids && c.collapsed ? () => onUpdateCategory(c.id, { collapsed: false }) : undefined}
          >
            {(over) => (
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(CATEGORY_DRAG, c.id);
                  e.dataTransfer.effectAllowed = "move";
                  dragging.categoryId = c.id;
                }}
                onDragEnd={() => {
                  dragging.categoryId = null;
                }}
                className={`${rowClass(over, active)} pr-1`}
                style={{ paddingLeft: depth * INDENT }}
              >
                {hasKids ? (
                  <button
                    type="button"
                    onClick={() => onUpdateCategory(c.id, { collapsed: !c.collapsed })}
                    aria-label={expanded ? `Fold ${c.name}` : `Unfold ${c.name}`}
                    aria-expanded={expanded}
                    className="hidden h-6 w-5 shrink-0 place-items-center rounded text-slate-400 hover:text-slate-700 md:grid dark:hover:text-slate-200"
                  >
                    <span className={`text-[10px] transition-transform ${expanded ? "rotate-90" : ""}`}>▶</span>
                  </button>
                ) : (
                  <span className="hidden w-5 shrink-0 md:block" />
                )}
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 pr-2 text-left text-sm md:pl-1 ${active ? "font-semibold text-sky-900 dark:text-sky-100" : "text-slate-600 dark:text-slate-300"}`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLORS[c.color].dot}`} />
                  <span className="truncate">{c.name}</span>
                  {hasKids && (
                    <span aria-hidden className="text-xs text-slate-400 md:hidden">
                      ▸
                    </span>
                  )}
                </button>
                <CountPill n={counts[c.id] ?? 0} hideOnHover />
              </div>
            )}
          </DropZone>
          <div className="flex items-center gap-0.5 pr-1 md:absolute md:right-1 md:top-1/2 md:-translate-y-1/2 md:opacity-0 md:group-hover/row:opacity-100 md:focus-within:opacity-100">
            <button
              type="button"
              onClick={() => setEditing({ mode: "add", parentId: c.id })}
              aria-label={`Add a sub-compartment to ${c.name}`}
              title="Add sub-compartment"
              className="hidden h-6 w-6 place-items-center rounded text-base leading-none text-slate-400 hover:bg-white/80 hover:text-sky-700 md:grid dark:hover:bg-white/10 dark:hover:text-sky-200"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setEditing({ mode: "edit", id: c.id })}
              aria-label={`Edit ${c.name}`}
              title="Rename / recolour / move / delete"
              className={`${active ? "grid" : "hidden"} h-6 w-6 place-items-center rounded text-slate-400 hover:bg-white/80 hover:text-slate-700 md:grid dark:hover:bg-white/10 dark:hover:text-slate-200`}
            >
              ⋯
            </button>
          </div>
        </div>

        {editing?.mode === "add" && editing.parentId === c.id && (
          <div className="mt-1 hidden md:block" style={{ paddingLeft: (depth + 1) * INDENT }}>
            <CategoryEditor
              tree={tree}
              parentId={c.id}
              onCancel={() => setEditing(null)}
              onSave={(name, color) => {
                onAddCategory(name, color, c.id);
                setEditing(null);
              }}
            />
          </div>
        )}

        {/* Phones only show top-level compartments here; deeper levels are reached from the main area. */}
        {expanded && <div className="hidden md:block">{kids.map((k) => renderNode(k, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <nav aria-label="Compartments" className="md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
      <h2 className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-sky-700/70 md:block dark:text-sky-300/60">
        Compartments
      </h2>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
        <DropZone
          className="shrink-0"
          onCategory={(id) => onMoveCategory(id, null)}
          acceptsCategory={(id) => tree.byId.get(id)?.parentId != null}
        >
          {(over) => (
            <div className={rowClass(over, selected === "all")}>
              <button
                type="button"
                onClick={() => onSelect("all")}
                title="Drop a compartment here to make it top-level"
                className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm ${selected === "all" ? "font-semibold text-sky-900 dark:text-sky-100" : "text-slate-600 dark:text-slate-300"}`}
              >
                <span aria-hidden>❄</span>
                <span className="truncate">All ideas</span>
              </button>
              <span className="pr-2">
                <CountPill n={counts.all ?? 0} />
              </span>
            </div>
          )}
        </DropZone>
        <DropZone className="shrink-0" onIdea={(id) => onMoveIdea(id, null)}>
          {(over) => (
            <div className={rowClass(over, selected === "unsorted")}>
              <button
                type="button"
                onClick={() => onSelect("unsorted")}
                className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm ${selected === "unsorted" ? "font-semibold text-sky-900 dark:text-sky-100" : "text-slate-600 dark:text-slate-300"}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-slate-400" />
                <span className="truncate">Unsorted</span>
              </button>
              <span className="pr-2">
                <CountPill n={counts.unsorted ?? 0} />
              </span>
            </div>
          )}
        </DropZone>

        <div className="my-1 hidden border-t border-sky-200/70 md:block dark:border-sky-300/10" />

        {childrenOf(tree, null).map((c) => renderNode(c, 0))}

        {editing?.mode === "add" && editing.parentId === null ? (
          <CategoryEditor
            tree={tree}
            parentId={null}
            onCancel={() => setEditing(null)}
            onSave={(name, color) => {
              onAddCategory(name, color, null);
              setEditing(null);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing({ mode: "add", parentId: null })}
            className="shrink-0 rounded-lg border border-dashed border-sky-300/80 px-3 py-2 text-left text-sm text-sky-700 hover:bg-white/50 md:mt-1 dark:border-sky-300/20 dark:text-sky-300 dark:hover:bg-white/5"
          >
            + New compartment
          </button>
        )}
      </div>
      <p className="mt-3 hidden px-3 text-xs leading-relaxed text-slate-500 md:block dark:text-slate-500">
        Drag cards — or whole compartments — onto a compartment to file them inside. Hover a compartment and press <b>+</b> to nest a new one.
      </p>
    </nav>
  );
}

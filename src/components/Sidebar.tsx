"use client";

import { useState } from "react";
import { COLORS, COLOR_KEYS } from "@/lib/theme";
import type { Category, ColorKey } from "@/lib/types";
import { DRAG_TYPE } from "./IdeaCard";

/** "all", "unsorted", or a category id. */
export type Selection = string;

function DropTarget({
  onDropIdea,
  active,
  onClick,
  children,
}: {
  onDropIdea?: (ideaId: string) => void;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!onDropIdea || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id && onDropIdea) {
          e.preventDefault();
          onDropIdea(id);
        }
      }}
      className={`flex shrink-0 items-center gap-1 rounded-lg transition ${
        over
          ? "bg-sky-200/80 ring-2 ring-sky-400 dark:bg-sky-400/25"
          : active
            ? "bg-white/80 shadow-sm dark:bg-sky-400/10"
            : "hover:bg-white/50 dark:hover:bg-white/5"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm ${active ? "font-semibold text-sky-900 dark:text-sky-100" : "text-slate-600 dark:text-slate-300"}`}
      >
        {children}
      </button>
    </div>
  );
}

function CategoryEditor({
  category,
  onSave,
  onDelete,
  onCancel,
}: {
  category?: Category;
  onSave: (name: string, color: ColorKey) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<ColorKey>(category?.color ?? "ice");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim(), color);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="frost-card w-60 shrink-0 space-y-2 rounded-lg p-2 md:w-auto"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Compartment name"
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
            Save
          </button>
        </div>
      </div>
    </form>
  );
}

export function Sidebar({
  categories,
  counts,
  selected,
  onSelect,
  onMoveIdea,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: {
  categories: Category[];
  counts: Record<string, number>;
  selected: Selection;
  onSelect: (s: Selection) => void;
  onMoveIdea: (ideaId: string, categoryId: string | null) => void;
  onAddCategory: (name: string, color: ColorKey) => void;
  onUpdateCategory: (id: string, name: string, color: ColorKey) => void;
  onDeleteCategory: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null); // category id or "new"

  const count = (k: string) => (
    <span className="ml-auto rounded-full bg-sky-100/80 px-2 text-xs tabular-nums text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
      {counts[k] ?? 0}
    </span>
  );

  return (
    <nav aria-label="Compartments" className="md:sticky md:top-4">
      <h2 className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-sky-700/70 md:block dark:text-sky-300/60">
        Compartments
      </h2>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        <DropTarget active={selected === "all"} onClick={() => onSelect("all")}>
          <span aria-hidden>❄</span>
          <span className="truncate">All ideas</span>
          {count("all")}
        </DropTarget>
        <DropTarget
          active={selected === "unsorted"}
          onClick={() => onSelect("unsorted")}
          onDropIdea={(id) => onMoveIdea(id, null)}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-slate-400" />
          <span className="truncate">Unsorted</span>
          {count("unsorted")}
        </DropTarget>

        <div className="my-1 hidden border-t border-sky-200/70 md:block dark:border-sky-300/10" />

        {categories.map((c) =>
          editing === c.id ? (
            <CategoryEditor
              key={c.id}
              category={c}
              onCancel={() => setEditing(null)}
              onSave={(name, color) => {
                onUpdateCategory(c.id, name, color);
                setEditing(null);
              }}
              onDelete={() => {
                const n = counts[c.id] ?? 0;
                const msg = n
                  ? `Delete "${c.name}"? Its ${n} idea${n === 1 ? "" : "s"} will move to Unsorted.`
                  : `Delete "${c.name}"?`;
                if (confirm(msg)) {
                  onDeleteCategory(c.id);
                  setEditing(null);
                }
              }}
            />
          ) : (
            <div key={c.id} className="group/cat relative shrink-0">
              <DropTarget
                active={selected === c.id}
                onClick={() => onSelect(c.id)}
                onDropIdea={(id) => onMoveIdea(id, c.id)}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLORS[c.color].dot}`} />
                <span className="truncate pr-5 md:pr-0">{c.name}</span>
                {count(c.id)}
                <span className="w-5" />
              </DropTarget>
              <button
                type="button"
                onClick={() => setEditing(c.id)}
                aria-label={`Edit ${c.name}`}
                title="Rename / recolour / delete"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 text-slate-400 hover:bg-white/80 hover:text-slate-700 md:opacity-0 md:group-hover/cat:opacity-100 md:focus:opacity-100 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                ⋯
              </button>
            </div>
          ),
        )}

        {editing === "new" ? (
          <CategoryEditor
            onCancel={() => setEditing(null)}
            onSave={(name, color) => {
              onAddCategory(name, color);
              setEditing(null);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="shrink-0 rounded-lg border border-dashed border-sky-300/80 px-3 py-2 text-left text-sm text-sky-700 hover:bg-white/50 md:mt-1 dark:border-sky-300/20 dark:text-sky-300 dark:hover:bg-white/5"
          >
            + New compartment
          </button>
        )}
      </div>
      <p className="mt-3 hidden px-3 text-xs text-slate-500 md:block dark:text-slate-500">
        Tip: drag a card onto a compartment to move it.
      </p>
    </nav>
  );
}

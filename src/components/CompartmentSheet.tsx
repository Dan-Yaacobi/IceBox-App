"use client";

import { useState } from "react";
import { COLORS, COLOR_KEYS } from "@/lib/theme";
import { type Tree, flatten, isWithin } from "@/lib/tree";
import type { Category } from "@/lib/types";
import { PillSelect, Sheet } from "./Sheet";

/** Rename, recolour or move a compartment. Changes apply immediately. */
export function CompartmentSheet({
  tree,
  category,
  onChange,
  onClose,
}: {
  tree: Tree;
  category: Category;
  onChange: (patch: Partial<Omit<Category, "id">>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  // Can't move a compartment inside itself or one of its own sub-compartments.
  const destinations = flatten(tree).filter(({ category: c }) => !isWithin(tree, c.id, category.id));
  const parent = category.parentId ? tree.byId.get(category.parentId) : undefined;

  return (
    <Sheet label="Edit compartment" onClose={onClose}>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (e.target.value.trim()) onChange({ name: e.target.value.trim() });
        }}
        aria-label="Compartment name"
        className="w-full bg-transparent text-xl font-semibold text-slate-900 outline-none dark:text-slate-50"
      />

      <div className="mt-4 flex flex-wrap gap-2.5">
        {COLOR_KEYS.map((k) => (
          <button
            type="button"
            key={k}
            title={COLORS[k].label}
            aria-label={COLORS[k].label}
            aria-pressed={category.color === k}
            onClick={() => onChange({ color: k })}
            className={`h-7 w-7 rounded-full ${COLORS[k].dot} transition ${category.color === k ? "ring-2 ring-sky-700 ring-offset-2 ring-offset-white dark:ring-sky-200 dark:ring-offset-slate-900" : "opacity-70 hover:opacity-100"}`}
          />
        ))}
      </div>

      <div className="mt-4">
        <PillSelect
          label="Inside"
          value={category.parentId ?? ""}
          onChange={(v) => onChange({ parentId: v || null })}
          options={[
            { value: "", label: "Top level" },
            ...destinations.map(({ category: c, depth }) => ({
              value: c.id,
              label: "   ".repeat(depth) + c.name,
            })),
          ]}
        >
          <span className="text-slate-500 dark:text-slate-400">Inside</span>
          <span className="truncate font-medium">{parent?.name ?? "Top level"}</span>
        </PillSelect>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="ice-button rounded-xl px-5 py-2 text-sm font-semibold">
          Done
        </button>
      </div>
    </Sheet>
  );
}

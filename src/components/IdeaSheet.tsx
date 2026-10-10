"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/store";
import { STATUSES, STATUS_META } from "@/lib/theme";
import type { Idea } from "@/lib/types";
import { PillSelect, Sheet } from "./Sheet";

function parseTags(s: string): string[] {
  const seen = new Set<string>();
  for (const t of s.split(/[,\s]+/)) {
    const clean = t.replace(/^#/, "").trim().toLowerCase();
    if (clean) seen.add(clean);
  }
  return [...seen];
}

/** Edits an idea in place: every change is saved as you type, so there's only "Done". */
export function IdeaSheet({
  idea,
  compartments,
  onChange,
  onDelete,
  onClose,
}: {
  idea: Idea;
  /** Every compartment in tree order, with its nesting depth. */
  compartments: { id: string; name: string; depth: number }[];
  onChange: (patch: Partial<Idea>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  // Kept as typed (trailing commas etc.); the parsed list is what gets saved.
  const [tags, setTags] = useState(idea.tags.map((t) => `#${t}`).join(" "));
  const meta = STATUS_META[idea.status];
  const place = compartments.find((c) => c.id === idea.categoryId);

  return (
    <Sheet label="Edit idea" onClose={onClose}>
      <textarea
        value={idea.title}
        onChange={(e) => onChange({ title: e.target.value.replace(/\n/g, " ") })}
        rows={1}
        placeholder="Idea"
        aria-label="Idea"
        className="field-sizing-content w-full resize-none bg-transparent text-xl font-semibold leading-snug text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50"
      />
      <textarea
        value={idea.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Add notes…"
        aria-label="Notes"
        className="field-sizing-content mt-2 min-h-28 w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-300"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PillSelect
          label="Compartment"
          value={idea.categoryId ?? ""}
          onChange={(v) => onChange({ categoryId: v || null })}
          options={[
            { value: "", label: "Unsorted" },
            ...compartments.map((c) => ({ value: c.id, label: "   ".repeat(c.depth) + c.name })),
          ]}
        >
          <span aria-hidden>📁</span>
          <span className="truncate">{place?.name ?? "Unsorted"}</span>
        </PillSelect>
        <PillSelect
          label="Status"
          value={idea.status}
          onChange={(v) => onChange({ status: v as Idea["status"] })}
          options={STATUSES.map((s) => ({
            value: s,
            label: `${STATUS_META[s].emoji} ${STATUS_META[s].label} — ${STATUS_META[s].hint}`,
          }))}
        >
          <span aria-hidden>{meta.emoji}</span>
          {meta.label}
        </PillSelect>
      </div>

      <input
        value={tags}
        onChange={(e) => {
          setTags(e.target.value);
          onChange({ tags: parseTags(e.target.value) });
        }}
        placeholder="#tags"
        aria-label="Tags"
        className="mt-3 w-full bg-transparent text-sm text-sky-700 outline-none placeholder:text-slate-400 dark:text-sky-300"
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (confirm("Throw this idea out of the freezer for good?")) onDelete();
          }}
          className="rounded-lg px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
        >
          Delete
        </button>
        <span className="flex-1 text-right text-xs text-slate-400">Frozen {timeAgo(idea.createdAt)}</span>
        <button type="button" onClick={onClose} className="ice-button rounded-xl px-5 py-2 text-sm font-semibold">
          Done
        </button>
      </div>
    </Sheet>
  );
}

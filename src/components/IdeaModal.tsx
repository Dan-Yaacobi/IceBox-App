"use client";

import { useEffect, useRef, useState } from "react";
import { STATUSES, STATUS_META } from "@/lib/theme";
import type { Idea } from "@/lib/types";

function parseTags(s: string): string[] {
  const seen = new Set<string>();
  for (const t of s.split(/[,\s]+/)) {
    const clean = t.replace(/^#/, "").trim().toLowerCase();
    if (clean) seen.add(clean);
  }
  return [...seen];
}

export function IdeaModal({
  idea,
  compartments,
  onSave,
  onDelete,
  onClose,
}: {
  idea: Idea;
  /** Every compartment in tree order, with its nesting depth. */
  compartments: { id: string; name: string; depth: number }[];
  onSave: (patch: Partial<Idea>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(idea.title);
  const [notes, setNotes] = useState(idea.notes);
  const [categoryId, setCategoryId] = useState(idea.categoryId ?? "");
  const [status, setStatus] = useState(idea.status);
  const [tags, setTags] = useState(idea.tags.join(", "));
  const titleRef = useRef<HTMLInputElement>(null);

  const save = () => {
    const t = title.trim();
    if (!t) {
      titleRef.current?.focus();
      return;
    }
    onSave({
      title: t,
      notes: notes.trim(),
      categoryId: categoryId || null,
      status,
      tags: parseTags(tags),
    });
  };

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const field =
    "w-full rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/50 dark:border-sky-300/15 dark:bg-slate-900/60 dark:text-slate-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Edit idea"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            save();
          }
        }}
        className="frost-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-5 pb-[calc(1.25rem+var(--safe-bottom))] sm:rounded-2xl sm:pb-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            ❄ Idea
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 text-xl leading-none text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            ×
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Title</label>
        <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mb-4 text-lg font-semibold`} />

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={7}
          placeholder="Details, links, why it matters, first steps…"
          className={`${field} mb-4 resize-y`}
        />

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Compartment</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={field}>
              <option value="">Unsorted</option>
              {compartments.map((c) => (
                <option key={c.id} value={c.id}>
                  {"\u00A0\u00A0\u00A0".repeat(c.depth) + (c.depth ? "↳ " : "") + c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tags</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ai, mobile, weekend"
              className={field}
            />
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUSES.map((s) => {
            const m = STATUS_META[s];
            const active = s === status;
            return (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                title={m.hint}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  active
                    ? "border-sky-400 bg-sky-50 font-semibold text-sky-800 ring-2 ring-sky-300/50 dark:bg-sky-400/10 dark:text-sky-100"
                    : "border-sky-100 text-slate-600 hover:border-sky-300 dark:border-sky-300/10 dark:text-slate-300"
                }`}
              >
                <span aria-hidden>{m.emoji}</span> {m.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Throw this idea out of the freezer for good?")) onDelete();
            }}
            className="rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button type="submit" className="ice-button rounded-lg px-4 py-2 text-sm font-semibold" title="Save (Ctrl/⌘ + Enter)">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

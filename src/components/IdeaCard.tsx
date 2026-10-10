"use client";

import { timeAgo } from "@/lib/store";
import { COLORS, NEXT_STATUS, STATUS_META } from "@/lib/theme";
import { IDEA_DRAG } from "@/lib/drag";
import type { Category, Idea, Status } from "@/lib/types";

export function IdeaCard({
  idea,
  category,
  categoryLabel,
  onOpen,
  onStatus,
  onTag,
}: {
  idea: Idea;
  category: Category | undefined;
  /** Where the idea is filed, relative to the current view; omitted when obvious. */
  categoryLabel?: string;
  onOpen: () => void;
  onStatus: (s: Status) => void;
  onTag: (tag: string) => void;
}) {
  const meta = STATUS_META[idea.status];
  const next = NEXT_STATUS[idea.status];
  const stripe = category ? COLORS[category.color].stripe : "border-l-sky-200 dark:border-l-sky-800";
  const faded = idea.status === "served" || idea.status === "melted";

  return (
    <article
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(IDEA_DRAG, idea.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`frost-card group relative cursor-grab rounded-xl border-l-4 ${stripe} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-sky-400 active:cursor-grabbing ${faded ? "opacity-75" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          title={`${meta.hint}. Click to mark as ${STATUS_META[next].label}.`}
          onClick={(e) => {
            e.stopPropagation();
            onStatus(next);
          }}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition hover:brightness-95 ${meta.chip}`}
        >
          <span aria-hidden>{meta.emoji}</span>
          {meta.label}
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500" title={new Date(idea.updatedAt).toLocaleString()}>
          {timeAgo(idea.updatedAt)}
        </span>
      </div>

      <h3
        className={`font-semibold leading-snug text-slate-800 dark:text-slate-100 ${idea.status === "melted" ? "line-through decoration-slate-400" : ""}`}
      >
        {idea.title}
      </h3>
      {idea.notes && (
        <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">
          {idea.notes}
        </p>
      )}

      {(categoryLabel || idea.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {categoryLabel && (
            <span
              title={categoryLabel}
              className={`max-w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium ${category ? COLORS[category.color].chip : "bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400"}`}
            >
              {categoryLabel}
            </span>
          )}
          {idea.tags.map((t) => (
            <button
              type="button"
              key={t}
              onClick={(e) => {
                e.stopPropagation();
                onTag(t);
              }}
              className="rounded-md px-1 text-xs text-sky-600 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-400/10"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

"use client";

import { CATEGORY_DRAG, dragging } from "@/lib/drag";
import { COLORS } from "@/lib/theme";
import type { Category } from "@/lib/types";
import { DropZone } from "./DropZone";
import { ChevronIcon } from "./icons";

/** A compartment in a list: tap to open, drop ideas or compartments on it, long-press to drag it. */
export function CompartmentRow({
  category,
  count,
  subtitle,
  onOpen,
  onDropIdea,
  onDropCategory,
  acceptsCategory,
}: {
  category: Category;
  count: number;
  subtitle?: string;
  onOpen: () => void;
  onDropIdea: (ideaId: string) => void;
  onDropCategory: (categoryId: string) => void;
  acceptsCategory: (categoryId: string) => boolean;
}) {
  return (
    <DropZone onIdea={onDropIdea} onCategory={onDropCategory} acceptsCategory={acceptsCategory}>
      {(over) => (
        <div
          role="button"
          tabIndex={0}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(CATEGORY_DRAG, category.id);
            e.dataTransfer.effectAllowed = "move";
            dragging.categoryId = category.id;
          }}
          onDragEnd={() => {
            dragging.categoryId = null;
          }}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
          className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition focus-visible:outline-none ${
            over
              ? "bg-sky-200/70 dark:bg-sky-400/20"
              : "hover:bg-white/50 focus-visible:bg-white/60 active:bg-white/70 dark:hover:bg-white/5 dark:active:bg-white/10"
          }`}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COLORS[category.color].dot}`} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-slate-800 dark:text-slate-100">{category.name}</span>
            {subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
          </span>
          {count > 0 && <span className="text-sm tabular-nums text-slate-400 dark:text-slate-500">{count}</span>}
          <span className="text-slate-300 dark:text-slate-600">
            <ChevronIcon />
          </span>
        </div>
      )}
    </DropZone>
  );
}

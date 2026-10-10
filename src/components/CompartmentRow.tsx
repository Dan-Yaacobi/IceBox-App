"use client";

import { CATEGORY_DRAG, dragging } from "@/lib/drag";
import { COLORS } from "@/lib/theme";
import type { Category } from "@/lib/types";
import { useLongPress } from "@/lib/useLongPress";
import { DropZone } from "./DropZone";
import { CheckIcon } from "./icons";

/** A compartment drawn as a drawer front: tap to open, long-press to select, drag to move. */
export function CompartmentRow({
  category,
  count,
  subtitle,
  selecting,
  selected,
  onOpen,
  onSelect,
  onDropIdea,
  onDropCategory,
  acceptsCategory,
}: {
  category: Category;
  count: number;
  subtitle?: string;
  selecting?: boolean;
  selected?: boolean;
  onOpen: () => void;
  /** Toggles selection; also what a long press does. */
  onSelect?: () => void;
  onDropIdea: (ideaId: string) => void;
  onDropCategory: (categoryId: string) => void;
  acceptsCategory: (categoryId: string) => boolean;
}) {
  const press = useLongPress(() => onSelect?.());
  const activate = selecting && onSelect ? onSelect : onOpen;

  return (
    <DropZone onIdea={onDropIdea} onCategory={onDropCategory} acceptsCategory={acceptsCategory}>
      {(over) => (
        <div
          role="button"
          tabIndex={0}
          aria-pressed={selecting ? !!selected : undefined}
          draggable={!selecting}
          {...(onSelect ? press : {})}
          onDragStart={(e) => {
            e.dataTransfer.setData(CATEGORY_DRAG, category.id);
            e.dataTransfer.effectAllowed = "move";
            dragging.categoryId = category.id;
          }}
          onDragEnd={() => {
            dragging.categoryId = null;
          }}
          onClick={activate}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activate();
            }
          }}
          className={`drawer-front flex cursor-pointer items-center gap-3 rounded-xl border-l-4 ${COLORS[category.color].stripe} px-4 py-3.5 transition focus-visible:outline-none active:scale-[0.99] ${
            over ? "ring-2 ring-sky-400" : selected ? "ring-2 ring-sky-500 dark:ring-sky-300" : ""
          }`}
        >
          {selecting && (
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${selected ? "border-sky-500 bg-sky-500 text-white" : "border-slate-300 dark:border-slate-600"}`}
            >
              {selected && <CheckIcon />}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-slate-800 dark:text-slate-100">{category.name}</span>
            {subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
          </span>
          {count > 0 && <span className="text-sm tabular-nums text-slate-400 dark:text-slate-500">{count}</span>}
          <span aria-hidden className="drawer-handle" />
        </div>
      )}
    </DropZone>
  );
}

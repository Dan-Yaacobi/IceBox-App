"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_DRAG, IDEA_DRAG, dragging } from "@/lib/drag";

/**
 * A drop target for idea cards and/or compartments. `children` is a render
 * function receiving whether something droppable is hovering over it.
 */
export function DropZone({
  onIdea,
  onCategory,
  acceptsCategory,
  onHoverExpand,
  className,
  children,
}: {
  onIdea?: (ideaId: string) => void;
  onCategory?: (categoryId: string) => void;
  /** Rejects specific compartments (e.g. dropping one into its own child). */
  acceptsCategory?: (categoryId: string) => boolean;
  /** Called after hovering a moment, to unfold a collapsed compartment. */
  onHoverExpand?: () => void;
  className?: string;
  children: (over: boolean) => React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const accepts = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (onIdea && types.includes(IDEA_DRAG)) return true;
    if (onCategory && types.includes(CATEGORY_DRAG)) {
      const id = dragging.categoryId;
      return !!id && (acceptsCategory?.(id) ?? true);
    }
    return false;
  };

  return (
    <div
      className={className}
      // Accepting dragenter is what makes this the drop target in spec-strict
      // implementations (the touch polyfill); desktop browsers only need dragover.
      onDragEnter={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
        if (onHoverExpand && !timer.current) timer.current = setTimeout(onHoverExpand, 650);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setOver(false);
        clearTimer();
      }}
      onDrop={(e) => {
        setOver(false);
        clearTimer();
        if (!accepts(e)) return;
        e.preventDefault();
        e.stopPropagation();
        const ideaId = e.dataTransfer.getData(IDEA_DRAG);
        const catId = e.dataTransfer.getData(CATEGORY_DRAG);
        if (ideaId && onIdea) onIdea(ideaId);
        else if (catId && onCategory) onCategory(catId);
      }}
    >
      {children(over)}
    </div>
  );
}

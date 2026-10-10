export const IDEA_DRAG = "application/x-icebox-idea";
export const CATEGORY_DRAG = "application/x-icebox-compartment";

/**
 * dataTransfer contents can't be read during dragover, so the compartment being
 * dragged is tracked here to reject invalid drop targets (itself or its children).
 */
export const dragging: { categoryId: string | null } = { categoryId: null };

export type Status = "frozen" | "thawing" | "served" | "melted";

export type ColorKey =
  | "ice"
  | "glacier"
  | "mint"
  | "aurora"
  | "lavender"
  | "berry"
  | "popsicle"
  | "slate";

export interface Category {
  id: string;
  name: string;
  color: ColorKey;
  /** null means a top-level compartment. Nesting depth is unlimited. */
  parentId: string | null;
  /** Whether its sub-compartments are folded away in the sidebar. */
  collapsed?: boolean;
  createdAt: number;
}

export interface Idea {
  id: string;
  title: string;
  notes: string;
  /** null means the idea sits in "Unsorted". */
  categoryId: string | null;
  status: Status;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface IceBoxData {
  version: 1;
  categories: Category[];
  ideas: Idea[];
}

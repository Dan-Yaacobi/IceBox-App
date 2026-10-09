import { COLOR_KEYS, STATUSES } from "./theme";
import type { Category, IceBoxData, Idea } from "./types";

export const STORAGE_KEY = "icebox:v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type Action =
  | { type: "load"; data: IceBoxData }
  | { type: "addIdea"; idea: Idea }
  | { type: "updateIdea"; id: string; patch: Partial<Omit<Idea, "id">> }
  | { type: "deleteIdea"; id: string }
  | { type: "addCategory"; category: Category }
  | { type: "updateCategory"; id: string; patch: Partial<Omit<Category, "id">> }
  | { type: "deleteCategory"; id: string };

export function reducer(state: IceBoxData, action: Action): IceBoxData {
  switch (action.type) {
    case "load":
      return action.data;
    case "addIdea":
      return { ...state, ideas: [action.idea, ...state.ideas] };
    case "updateIdea":
      return {
        ...state,
        ideas: state.ideas.map((i) =>
          i.id === action.id ? { ...i, ...action.patch, updatedAt: Date.now() } : i,
        ),
      };
    case "deleteIdea":
      return { ...state, ideas: state.ideas.filter((i) => i.id !== action.id) };
    case "addCategory":
      return { ...state, categories: [...state.categories, action.category] };
    case "updateCategory":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "deleteCategory":
      return {
        categories: state.categories.filter((c) => c.id !== action.id),
        ideas: state.ideas.map((i) =>
          i.categoryId === action.id ? { ...i, categoryId: null } : i,
        ),
        version: 1,
      };
  }
}

export const EMPTY: IceBoxData = { version: 1, categories: [], ideas: [] };

export function seedData(): IceBoxData {
  const now = Date.now();
  const cat = (name: string, color: Category["color"]): Category => ({
    id: newId(),
    name,
    color,
    createdAt: now,
  });
  const categories = [
    cat("Apps", "ice"),
    cat("Side projects", "mint"),
    cat("Business", "lavender"),
    cat("Someday", "slate"),
  ];
  const idea = (
    title: string,
    notes: string,
    categoryId: string | null,
    status: Idea["status"],
    tags: string[],
    ageMinutes: number,
  ): Idea => ({
    id: newId(),
    title,
    notes,
    categoryId,
    status,
    tags,
    createdAt: now - ageMinutes * 60_000,
    updatedAt: now - ageMinutes * 60_000,
  });
  return {
    version: 1,
    categories,
    ideas: [
      idea(
        "Welcome to your IceBox 🧊",
        "Type an idea in the box at the top and press Enter to freeze it.\n\nClick a card to add notes, tags or move it. Drag cards onto a compartment in the sidebar to re-file them, or switch to Board view and drag between statuses.\n\nDelete this card whenever you like.",
        null,
        "frozen",
        ["tips"],
        1,
      ),
      idea(
        "Status chip = one-click progress",
        "Click the status chip on any card to cycle Frozen → Thawing → Served. Mark ideas you've dropped as Melted from the card editor.",
        categories[0].id,
        "thawing",
        ["tips"],
        2,
      ),
      idea(
        "Back up the freezer",
        "Your ideas are stored in this browser. Use Export in the top-right to download a JSON backup, and Import to restore it on another device.",
        categories[3].id,
        "served",
        ["tips"],
        3,
      ),
    ],
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Validates and normalises untrusted data (localStorage or an imported file). */
export function parseData(raw: unknown): IceBoxData | null {
  if (!isObj(raw) || !Array.isArray(raw.categories) || !Array.isArray(raw.ideas)) {
    return null;
  }
  const categories: Category[] = raw.categories.filter(isObj).flatMap((c) =>
    typeof c.id === "string" && typeof c.name === "string"
      ? [
          {
            id: c.id,
            name: c.name,
            color: COLOR_KEYS.includes(c.color as Category["color"])
              ? (c.color as Category["color"])
              : "ice",
            createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
          },
        ]
      : [],
  );
  const catIds = new Set(categories.map((c) => c.id));
  const ideas: Idea[] = raw.ideas.filter(isObj).flatMap((i) =>
    typeof i.id === "string" && typeof i.title === "string"
      ? [
          {
            id: i.id,
            title: i.title,
            notes: typeof i.notes === "string" ? i.notes : "",
            categoryId:
              typeof i.categoryId === "string" && catIds.has(i.categoryId)
                ? i.categoryId
                : null,
            status: STATUSES.includes(i.status as Idea["status"])
              ? (i.status as Idea["status"])
              : "frozen",
            tags: Array.isArray(i.tags)
              ? i.tags.filter((t): t is string => typeof t === "string")
              : [],
            createdAt: typeof i.createdAt === "number" ? i.createdAt : Date.now(),
            updatedAt: typeof i.updatedAt === "number" ? i.updatedAt : Date.now(),
          },
        ]
      : [],
  );
  return { version: 1, categories, ideas };
}

export function loadData(): IceBoxData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedData();
    return parseData(JSON.parse(raw)) ?? seedData();
  } catch {
    return seedData();
  }
}

export function saveData(data: IceBoxData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked; nothing sensible to do beyond keeping in-memory state.
  }
}

export function timeAgo(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

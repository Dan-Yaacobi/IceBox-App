import { Preferences } from "@capacitor/preferences";
import { isNativeApp } from "./platform";
import { COLOR_KEYS, STATUSES } from "./theme";
import { buildTree, isWithin } from "./tree";
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
    case "updateCategory": {
      const patch = { ...action.patch };
      // A compartment can't be moved inside itself or one of its own sub-compartments.
      if (
        patch.parentId != null &&
        isWithin(buildTree(state.categories), patch.parentId, action.id)
      ) {
        delete patch.parentId;
      }
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.id ? { ...c, ...patch } : c,
        ),
      };
    }
    case "deleteCategory": {
      // Nothing inside is lost: sub-compartments and ideas move up one level.
      const target = state.categories.find((c) => c.id === action.id);
      if (!target) return state;
      const parentId = target.parentId;
      return {
        version: 1,
        categories: state.categories
          .filter((c) => c.id !== action.id)
          .map((c) => (c.parentId === action.id ? { ...c, parentId } : c)),
        ideas: state.ideas.map((i) =>
          i.categoryId === action.id ? { ...i, categoryId: parentId } : i,
        ),
      };
    }
  }
}

export const EMPTY: IceBoxData = { version: 1, categories: [], ideas: [] };

export function seedData(): IceBoxData {
  const now = Date.now();
  const cat = (
    name: string,
    color: Category["color"],
    parent: Category | null = null,
  ): Category => ({
    id: newId(),
    name,
    color,
    parentId: parent?.id ?? null,
    createdAt: now,
  });
  const apps = cat("Apps", "ice");
  const games = cat("Game development", "aurora");
  const shooter = cat("Space shooter", "aurora", games);
  const shooterUi = cat("UI", "aurora", shooter);
  const someday = cat("Someday", "slate");
  const categories = [
    apps,
    games,
    shooter,
    shooterUi,
    cat("Gameplay", "aurora", shooter),
    cat("Business", "lavender"),
    someday,
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
        "Type an idea in the box at the top and press Enter to freeze it. It lands in whatever compartment you're in.\n\nTap an idea to add notes or tags, or to move it to another compartment. Compartments can hold sub-compartments as deep as you like.\n\nOn a phone, long-press an idea or compartment and drag it onto a compartment, or onto the back link to move it up.\n\nDelete this idea whenever you like.",
        null,
        "frozen",
        ["tips"],
        1,
      ),
      idea(
        "Thawing = working on it",
        "Open an idea and tap its status to change it: Frozen (for later), Thawing (in progress), Served (done) or Melted (dropped). Served and melted ideas tuck away under \"Show finished\".",
        apps.id,
        "thawing",
        ["tips"],
        2,
      ),
      idea(
        "Back up the freezer",
        "Your ideas are stored on this device. Use Export backup in the ⋯ menu on the home screen to save a copy, and Import backup to restore it.",
        someday.id,
        "served",
        ["tips"],
        3,
      ),
      idea(
        "Radial weapon wheel",
        "An example of an idea filed three levels deep.",
        shooterUi.id,
        "frozen",
        ["example"],
        4,
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
            parentId: typeof c.parentId === "string" ? c.parentId : null,
            collapsed: c.collapsed === true,
            createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
          },
        ]
      : [],
  );
  const catIds = new Set(categories.map((c) => c.id));
  // Drop dangling parents and break any parent cycles so the tree stays a tree.
  const parentOf = new Map(categories.map((c) => [c.id, c.parentId]));
  for (const c of categories) {
    if (c.parentId !== null && !catIds.has(c.parentId)) c.parentId = null;
    const seen = new Set([c.id]);
    for (let p = c.parentId; p !== null; p = parentOf.get(p) ?? null) {
      if (seen.has(p)) {
        c.parentId = null;
        break;
      }
      seen.add(p);
    }
    parentOf.set(c.id, c.parentId);
  }
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

function parseRaw(raw: string | null): IceBoxData | null {
  if (raw === null) return null;
  try {
    return parseData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readLocal(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * In the Android app ideas live in native storage (Capacitor Preferences), with the
 * WebView's localStorage as a fallback copy. In a browser only localStorage is used.
 */
export async function loadData(): Promise<IceBoxData> {
  if (isNativeApp()) {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      const native = parseRaw(value);
      if (native) return native;
    } catch {
      // fall through to the local copy
    }
  }
  return parseRaw(readLocal()) ?? seedData();
}

let pendingNativeWrite: Promise<unknown> = Promise.resolve();

export function saveData(data: IceBoxData) {
  const json = JSON.stringify(data);
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // Storage full or blocked; nothing sensible to do beyond keeping in-memory state.
  }
  if (isNativeApp()) {
    // Chain writes so an older snapshot can never land after a newer one.
    pendingNativeWrite = pendingNativeWrite
      .catch(() => undefined)
      .then(() => Preferences.set({ key: STORAGE_KEY, value: json }));
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

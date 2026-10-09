"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { newId, parseData } from "@/lib/store";
import { COLORS, STATUSES, STATUS_META } from "@/lib/theme";
import type { Idea, Status } from "@/lib/types";
import { useIceBox } from "@/lib/useIceBox";
import { DRAG_TYPE, IdeaCard } from "./IdeaCard";
import { IdeaModal } from "./IdeaModal";
import { Sidebar, type Selection } from "./Sidebar";

type StatusFilter = "active" | "all" | Status;
type Sort = "updated" | "newest" | "oldest" | "az";
type View = "cards" | "board";

const STATUS_TABS: { key: StatusFilter; label: string; title: string }[] = [
  { key: "active", label: "In the freezer", title: "Frozen + Thawing" },
  ...STATUSES.map((s) => ({
    key: s,
    label: `${STATUS_META[s].emoji} ${STATUS_META[s].label}`,
    title: STATUS_META[s].hint,
  })),
  { key: "all", label: "Everything", title: "All statuses" },
];

const SORTS: Record<Sort, { label: string; fn: (a: Idea, b: Idea) => number }> = {
  updated: { label: "Recently touched", fn: (a, b) => b.updatedAt - a.updatedAt },
  newest: { label: "Newest first", fn: (a, b) => b.createdAt - a.createdAt },
  oldest: { label: "Oldest first", fn: (a, b) => a.createdAt - b.createdAt },
  az: { label: "A → Z", fn: (a, b) => a.title.localeCompare(b.title) },
};

function isTyping(el: EventTarget | null) {
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
  );
}

export function IceBoxApp() {
  const { data, dispatch, loaded } = useIceBox();
  const [selected, setSelected] = useState<Selection>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [view, setView] = useState<View>("cards");
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const catById = useMemo(() => new Map(data.categories.map((c) => [c.id, c])), [data.categories]);
  const selectedCategory = catById.get(selected);

  // A deleted category can't stay selected.
  useEffect(() => {
    if (selected !== "all" && selected !== "unsorted" && !catById.has(selected)) setSelected("all");
  }, [selected, catById]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Shortcuts: "n" to capture a new idea, "/" to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openId || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") {
        e.preventDefault();
        captureRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  // Ideas filtered by compartment + search (status filtering happens per view).
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const tagQuery = q.startsWith("#") ? q.slice(1) : null;
    return data.ideas.filter((i) => {
      if (selected === "unsorted" && i.categoryId !== null) return false;
      if (selected !== "all" && selected !== "unsorted" && i.categoryId !== selected) return false;
      if (!q) return true;
      if (tagQuery !== null) return i.tags.some((t) => t.startsWith(tagQuery));
      return (
        i.title.toLowerCase().includes(q) ||
        i.notes.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
      );
    });
  }, [data.ideas, selected, query]);

  const visible = useMemo(() => {
    const list = scoped.filter((i) =>
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? i.status === "frozen" || i.status === "thawing"
          : i.status === statusFilter,
    );
    return list.sort(SORTS[sort].fn);
  }, [scoped, statusFilter, sort]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, unsorted: 0 };
    for (const i of data.ideas) {
      if (i.status === "served" || i.status === "melted") continue;
      c.all++;
      const k = i.categoryId ?? "unsorted";
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [data.ideas]);

  const stats = useMemo(() => {
    const s: Record<Status, number> = { frozen: 0, thawing: 0, served: 0, melted: 0 };
    for (const i of data.ideas) s[i.status]++;
    return s;
  }, [data.ideas]);

  const freeze = () => {
    const title = draft.trim();
    if (!title) return;
    const now = Date.now();
    dispatch({
      type: "addIdea",
      idea: {
        id: newId(),
        title,
        notes: "",
        categoryId: selectedCategory?.id ?? null,
        status: "frozen",
        tags: [],
        createdAt: now,
        updatedAt: now,
      },
    });
    setDraft("");
    if (statusFilter !== "active" && statusFilter !== "all" && statusFilter !== "frozen") {
      setStatusFilter("active");
    }
    setToast(`🧊 Frozen into ${selectedCategory?.name ?? "Unsorted"}`);
  };

  const moveIdea = (id: string, categoryId: string | null) => {
    const idea = data.ideas.find((i) => i.id === id);
    if (!idea || idea.categoryId === categoryId) return;
    dispatch({ type: "updateIdea", id, patch: { categoryId } });
    setToast(`Moved to ${categoryId ? catById.get(categoryId)?.name : "Unsorted"}`);
  };

  const setStatus = (id: string, status: Status) => dispatch({ type: "updateIdea", id, patch: { status } });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icebox-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const parsed = parseData(JSON.parse(await file.text()));
      if (!parsed) throw new Error("bad shape");
      if (
        confirm(
          `Replace your current freezer (${data.ideas.length} ideas) with ${parsed.ideas.length} ideas and ${parsed.categories.length} compartments from "${file.name}"?`,
        )
      ) {
        dispatch({ type: "load", data: parsed });
        setSelected("all");
        setToast("Freezer restored from backup");
      }
    } catch {
      alert("That file doesn't look like an IceBox backup.");
    }
  };

  const closeModal = useCallback(() => setOpenId(null), []);
  const openIdea = openId ? data.ideas.find((i) => i.id === openId) : undefined;
  const heading =
    selected === "all" ? "All ideas" : selected === "unsorted" ? "Unsorted" : (selectedCategory?.name ?? "");

  const card = (idea: Idea) => (
    <IdeaCard
      key={idea.id}
      idea={idea}
      category={idea.categoryId ? catById.get(idea.categoryId) : undefined}
      showCategory={selected === "all"}
      onOpen={() => setOpenId(idea.id)}
      onStatus={(s) => setStatus(idea.id, s)}
      onTag={(t) => setQuery(`#${t}`)}
    />
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          <div className="ice-cube grid h-11 w-11 place-items-center rounded-xl text-2xl" aria-hidden>
            ❄
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-sky-950 dark:text-sky-50">
              Ice<span className="text-sky-500 dark:text-sky-300">Box</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.frozen} frozen · {stats.thawing} thawing · {stats.served} served
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportData} className="ghost-button rounded-lg px-3 py-1.5 text-sm" title="Download a JSON backup">
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="ghost-button rounded-lg px-3 py-1.5 text-sm"
            title="Restore from a JSON backup"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importData(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {/* Quick capture */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          freeze();
        }}
        className="frost-panel mb-6 flex items-center gap-2 rounded-2xl p-2 pl-4"
      >
        <span aria-hidden className="text-xl">🧊</span>
        <input
          ref={captureRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Got an idea? Type it and press Enter to freeze it…"
          aria-label="New idea"
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {selectedCategory && (
          <span className={`hidden shrink-0 rounded-md px-2 py-0.5 text-xs font-medium sm:inline ${COLORS[selectedCategory.color].chip}`}>
            → {selectedCategory.name}
          </span>
        )}
        <button type="submit" disabled={!draft.trim()} className="ice-button shrink-0 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50">
          Freeze
        </button>
      </form>

      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <Sidebar
            categories={data.categories}
            counts={counts}
            selected={selected}
            onSelect={setSelected}
            onMoveIdea={moveIdea}
            onAddCategory={(name, color) => {
              const category = { id: newId(), name, color, createdAt: Date.now() };
              dispatch({ type: "addCategory", category });
              setSelected(category.id);
            }}
            onUpdateCategory={(id, name, color) => dispatch({ type: "updateCategory", id, patch: { name, color } })}
            onDeleteCategory={(id) => dispatch({ type: "deleteCategory", id })}
          />
        </aside>

        <main className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="mr-auto text-lg font-semibold text-sky-950 dark:text-sky-50">{heading}</h2>
            <div className="relative">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…  ( / )"
                aria-label="Search ideas"
                className="w-44 rounded-lg border border-sky-200 bg-white/70 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-300/50 sm:w-56 dark:border-sky-300/15 dark:bg-slate-900/50 dark:text-slate-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              )}
            </div>
            {view === "cards" && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort"
                className="rounded-lg border border-sky-200 bg-white/70 px-2 py-1.5 text-sm text-slate-700 outline-none dark:border-sky-300/15 dark:bg-slate-900/50 dark:text-slate-200"
              >
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            )}
            <div className="flex rounded-lg border border-sky-200 bg-white/50 p-0.5 text-sm dark:border-sky-300/15 dark:bg-slate-900/40">
              {(["cards", "board"] as View[]).map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 capitalize ${view === v ? "bg-sky-500 font-medium text-white shadow-sm" : "text-slate-600 dark:text-slate-300"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {!loaded ? null : view === "cards" ? (
            <>
              <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
                {STATUS_TABS.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    title={t.title}
                    onClick={() => setStatusFilter(t.key)}
                    className={`shrink-0 rounded-full px-3 py-1 text-sm transition ${
                      statusFilter === t.key
                        ? "bg-sky-900 text-white dark:bg-sky-300 dark:text-sky-950"
                        : "text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {visible.length === 0 ? (
                <EmptyState searching={!!query} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map(card)}</div>
              )}
            </>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {STATUSES.map((s) => (
                <BoardColumn
                  key={s}
                  status={s}
                  ideas={scoped.filter((i) => i.status === s).sort(SORTS.updated.fn)}
                  onDropIdea={(id) => setStatus(id, s)}
                  renderCard={card}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-500 dark:text-slate-500">
        Your ideas are kept in this browser. Use <b>Export</b> now and then to back them up. · Shortcuts:{" "}
        <kbd className="kbd">n</kbd> new idea, <kbd className="kbd">/</kbd> search
      </footer>

      {openIdea && (
        <IdeaModal
          key={openIdea.id}
          idea={openIdea}
          categories={data.categories}
          onClose={closeModal}
          onDelete={() => {
            dispatch({ type: "deleteIdea", id: openIdea.id });
            setOpenId(null);
          }}
          onSave={(patch) => {
            dispatch({ type: "updateIdea", id: openIdea.id, patch });
            setOpenId(null);
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className="frost-panel fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-sky-900 shadow-lg dark:text-sky-100"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function BoardColumn({
  status,
  ideas,
  onDropIdea,
  renderCard,
}: {
  status: Status;
  ideas: Idea[];
  onDropIdea: (id: string) => void;
  renderCard: (i: Idea) => React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const meta = STATUS_META[status];
  return (
    <section
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id) {
          e.preventDefault();
          onDropIdea(id);
        }
      }}
      className={`flex min-h-40 flex-col rounded-2xl border p-2 transition ${
        over
          ? "border-sky-400 bg-sky-100/70 dark:bg-sky-400/10"
          : "border-white/60 bg-white/30 dark:border-sky-300/10 dark:bg-slate-900/30"
      }`}
    >
      <header className="flex items-center gap-2 px-2 py-1.5" title={meta.hint}>
        <span aria-hidden>{meta.emoji}</span>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{meta.label}</h3>
        <span className="ml-auto text-xs tabular-nums text-slate-400">{ideas.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {ideas.map(renderCard)}
        {ideas.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-slate-400 dark:text-slate-500">Drop ideas here</p>
        )}
      </div>
    </section>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="frost-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        {searching ? "🔍" : "🧊"}
      </div>
      <p className="font-medium text-slate-700 dark:text-slate-200">
        {searching ? "Nothing in the freezer matches that." : "This shelf is empty."}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {searching ? "Try a different word, or #tag." : "Type an idea in the box above and press Enter to freeze it."}
      </p>
    </div>
  );
}

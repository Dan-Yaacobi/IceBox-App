"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { enableTouchDrag, saveTextFile, useBackButton } from "@/lib/native";
import { isNativeApp } from "@/lib/platform";
import { newId, parseData } from "@/lib/store";
import { COLORS, COLOR_KEYS } from "@/lib/theme";
import { buildTree, childrenOf, flatten, isWithin, pathLabel, pathTo, rollUp } from "@/lib/tree";
import type { Category, Idea } from "@/lib/types";
import { useIceBox } from "@/lib/useIceBox";
import { CompartmentRow } from "./CompartmentRow";
import { CompartmentSheet } from "./CompartmentSheet";
import { DropZone } from "./DropZone";
import { IdeaRow } from "./IdeaRow";
import { IdeaSheet } from "./IdeaSheet";
import { BackIcon, MoreIcon, PlusIcon, SearchIcon } from "./icons";

const isActive = (i: Idea) => i.status === "frozen" || i.status === "thawing";
const byRecent = (a: Idea, b: Idea) => b.updatedAt - a.updatedAt;

function isTyping(el: EventTarget | null) {
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
  );
}

type MenuItem = { label: string; onSelect: () => void; danger?: boolean } | { note: string };

export function IceBoxApp() {
  const { data, dispatch, loaded } = useIceBox();
  /** The compartment being viewed; null is the home screen. */
  const [location, setLocation] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [showFinished, setShowFinished] = useState(false);
  const [openIdeaId, setOpenIdeaId] = useState<string | null>(null);
  const [editingCompartment, setEditingCompartment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  // Only known after mount (the page is prerendered without Capacitor).
  const [native, setNative] = useState(false);
  const captureRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tree = useMemo(() => buildTree(data.categories), [data.categories]);
  const here = location ? tree.byId.get(location) : undefined;
  const hereId = here?.id ?? null;
  const parent = here?.parentId ? tree.byId.get(here.parentId) : undefined;
  const kids = childrenOf(tree, hereId);
  const nameOf = (id: string | null) => (id ? pathLabel(pathTo(tree, id), 2) : "Unsorted");

  useEffect(() => {
    setNative(isNativeApp());
    void enableTouchDrag();
  }, []);

  // A deleted compartment can't stay open.
  useEffect(() => {
    if (location && !tree.byId.has(location)) setLocation(null);
  }, [location, tree]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (id: string | null) => {
    setLocation(id);
    setShowFinished(false);
    setAdding(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  // Desktop shortcuts: "n" to capture, "/" to search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openIdeaId || editingCompartment || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") {
        e.preventDefault();
        captureRef.current?.focus();
      } else if (e.key === "/") {
        e.preventDefault();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdeaId, editingCompartment]);

  // Active ideas per compartment, including everything nested inside it.
  const counts = useMemo(() => {
    const direct: Record<string, number> = {};
    for (const i of data.ideas) {
      if (isActive(i) && i.categoryId) direct[i.categoryId] = (direct[i.categoryId] ?? 0) + 1;
    }
    return rollUp(tree, direct);
  }, [data.ideas, tree]);

  const ideasHere = useMemo(() => data.ideas.filter((i) => i.categoryId === hereId), [data.ideas, hereId]);
  const active = useMemo(() => ideasHere.filter(isActive).sort(byRecent), [ideasHere]);
  const finished = useMemo(() => ideasHere.filter((i) => !isActive(i)).sort(byRecent), [ideasHere]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const tag = q.startsWith("#") ? q.slice(1) : null;
    const ideas = data.ideas
      .filter((i) =>
        tag !== null
          ? i.tags.some((t) => t.startsWith(tag))
          : i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q)),
      )
      .sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || byRecent(a, b));
    const compartments = tag !== null ? [] : data.categories.filter((c) => c.name.toLowerCase().includes(q));
    return { ideas, compartments };
  }, [data.ideas, data.categories, query]);

  const freeze = () => {
    const title = draft.trim();
    if (!title) return;
    const now = Date.now();
    dispatch({
      type: "addIdea",
      idea: { id: newId(), title, notes: "", categoryId: hereId, status: "frozen", tags: [], createdAt: now, updatedAt: now },
    });
    setDraft("");
    setToast(here ? `❄ Frozen into ${here.name}` : "❄ Frozen");
  };

  const moveIdea = (id: string, categoryId: string | null) => {
    const idea = data.ideas.find((i) => i.id === id);
    if (!idea || idea.categoryId === categoryId) return;
    dispatch({ type: "updateIdea", id, patch: { categoryId } });
    setToast(`Moved to ${nameOf(categoryId)}`);
  };

  const moveCategory = (id: string, parentId: string | null) => {
    const c = tree.byId.get(id);
    if (!c || c.parentId === parentId) return;
    if (parentId !== null && isWithin(tree, parentId, id)) return;
    dispatch({ type: "updateCategory", id, patch: { parentId } });
    setToast(`Moved “${c.name}” to ${parentId ? nameOf(parentId) : "the top level"}`);
  };

  const acceptsInto = (targetId: string) => (dragId: string) =>
    !isWithin(tree, targetId, dragId) && tree.byId.get(dragId)?.parentId !== targetId;

  const addCompartment = () => {
    const name = newName.trim();
    if (!name) return;
    // Sub-compartments inherit their parent's colour; top-level ones take the next colour in turn.
    const color = here?.color ?? COLOR_KEYS[childrenOf(tree, null).length % COLOR_KEYS.length];
    const category: Category = { id: newId(), name, color, parentId: hereId, createdAt: Date.now() };
    dispatch({ type: "addCategory", category });
    setNewName(""); // stay open so several can be added in a row
  };

  const deleteCompartment = (c: Category) => {
    const ideas = data.ideas.filter((i) => i.categoryId === c.id).length;
    const subs = childrenOf(tree, c.id).length;
    const up = c.parentId ? `“${tree.byId.get(c.parentId)?.name}”` : null;
    const notes = [
      ideas && `${ideas} idea${ideas === 1 ? "" : "s"} will move to ${up ?? "Unsorted"}.`,
      subs && `${subs} sub-compartment${subs === 1 ? "" : "s"} will move up to ${up ?? "the top level"}.`,
    ].filter(Boolean);
    if (!confirm([`Delete “${c.name}”?`, ...notes].join("\n"))) return;
    setEditingCompartment(false);
    if (location === c.id) go(c.parentId);
    dispatch({ type: "deleteCategory", id: c.id });
  };

  const exportData = async () => {
    try {
      await saveTextFile(
        `icebox-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
        "application/json",
      );
    } catch {
      // The share sheet was dismissed; nothing to do.
    }
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
        go(null);
        setToast("Freezer restored from backup");
      }
    } catch {
      alert("That file doesn't look like an IceBox backup.");
    }
  };

  const openIdea = openIdeaId ? data.ideas.find((i) => i.id === openIdeaId) : undefined;
  const closeIdea = useCallback(() => {
    // Don't leave nameless ideas behind.
    const idea = data.ideas.find((i) => i.id === openIdeaId);
    if (idea && !idea.title.trim()) {
      if (idea.notes.trim()) dispatch({ type: "updateIdea", id: idea.id, patch: { title: "Untitled idea" } });
      else dispatch({ type: "deleteIdea", id: idea.id });
    }
    setOpenIdeaId(null);
  }, [data.ideas, openIdeaId, dispatch]);
  const closeCompartment = useCallback(() => setEditingCompartment(false), []);
  const compartmentOptions = useMemo(
    () => flatten(tree).map(({ category: c, depth }) => ({ id: c.id, name: c.name, depth })),
    [tree],
  );

  const closeSearch = () => {
    setSearching(false);
    setQuery("");
  };

  // Android back: close whatever is on top, then climb out of compartments.
  useBackButton(() => {
    if (openIdeaId) closeIdea();
    else if (editingCompartment) setEditingCompartment(false);
    else if (menuOpen) setMenuOpen(false);
    else if (searching) closeSearch();
    else if (adding) setAdding(false);
    else if (here) go(here.parentId);
    else return false;
    return true;
  });

  const menuItems: MenuItem[] = here
    ? [
        { label: "New sub-compartment", onSelect: () => setAdding(true) },
        { label: "Edit compartment", onSelect: () => setEditingCompartment(true) },
        { label: "Delete compartment", onSelect: () => deleteCompartment(here), danger: true },
      ]
    : [
        { label: "New compartment", onSelect: () => setAdding(true) },
        { label: "Export backup", onSelect: () => void exportData() },
        { label: "Import backup", onSelect: () => fileRef.current?.click() },
        { note: native ? "Ideas are saved on this phone." : "Ideas are saved in this browser." },
      ];

  const idea = (i: Idea, subtitle?: string) => (
    <IdeaRow key={i.id} idea={i} subtitle={subtitle} onOpen={() => setOpenIdeaId(i.id)} />
  );
  const showCompartments = kids.length > 0 || adding || !here;
  const empty = loaded && active.length === 0 && finished.length === 0 && kids.length === 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-16">
      {/* Top bar */}
      <header className="flex h-14 items-center gap-2 pt-1">
        {searching ? (
          <>
            <div className="frost-panel flex h-10 flex-1 items-center gap-2 rounded-xl px-3 text-slate-400">
              <SearchIcon />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeSearch();
                }}
                placeholder="Search ideas, #tags, compartments"
                aria-label="Search"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
            <button type="button" onClick={closeSearch} className="px-2 text-sm font-medium text-sky-700 dark:text-sky-300">
              Cancel
            </button>
          </>
        ) : (
          <>
            {here ? (
              <DropZone
                className="min-w-0"
                onIdea={(id) => moveIdea(id, here.parentId)}
                onCategory={(id) => moveCategory(id, here.parentId)}
                acceptsCategory={(id) => tree.byId.get(id)?.parentId !== here.parentId}
              >
                {(over) => (
                  <button
                    type="button"
                    onClick={() => go(here.parentId)}
                    className={`-ml-2 flex min-w-0 items-center gap-0.5 rounded-lg py-1.5 pl-1 pr-3 text-[15px] text-sky-700 transition dark:text-sky-300 ${over ? "bg-sky-200/70 dark:bg-sky-400/20" : "hover:bg-white/50 dark:hover:bg-white/5"}`}
                  >
                    <BackIcon />
                    <span className="truncate">{parent?.name ?? "IceBox"}</span>
                  </button>
                )}
              </DropZone>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="ice-cube grid h-8 w-8 place-items-center rounded-lg text-base" aria-hidden>
                  ❄
                </div>
                <h1 className="text-xl font-bold tracking-tight text-sky-950 dark:text-sky-50">
                  Ice<span className="text-sky-500 dark:text-sky-300">Box</span>
                </h1>
              </div>
            )}
            <div className="ml-auto flex items-center">
              <button
                type="button"
                onClick={() => setSearching(true)}
                aria-label="Search"
                className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/5"
              >
                <SearchIcon />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More"
                  aria-expanded={menuOpen}
                  className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/5"
                >
                  <MoreIcon />
                </button>
                {menuOpen && <Menu items={menuItems} onClose={() => setMenuOpen(false)} />}
              </div>
            </div>
          </>
        )}
      </header>

      <input
        ref={fileRef}
        type="file"
        // Android's picker hides .json files from some apps when filtered by type.
        accept={native ? undefined : "application/json,.json"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importData(f);
          e.target.value = "";
        }}
      />

      {searching ? (
        <SearchResults
          results={results}
          renderIdea={(i) => idea(i, nameOf(i.categoryId))}
          renderCompartment={(c) => (
            <CompartmentRow
              key={c.id}
              category={c}
              count={counts[c.id] ?? 0}
              subtitle={c.parentId ? pathLabel(pathTo(tree, c.parentId), 2) : undefined}
              onOpen={() => {
                closeSearch();
                go(c.id);
              }}
              onDropIdea={(id) => moveIdea(id, c.id)}
              onDropCategory={(id) => moveCategory(id, c.id)}
              acceptsCategory={acceptsInto(c.id)}
            />
          )}
        />
      ) : (
        <>
          {here && (
            <h2 className="mb-3 mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              <span className={`h-3 w-3 shrink-0 rounded-full ${COLORS[here.color].dot}`} />
              <span className="min-w-0 break-words">{here.name}</span>
            </h2>
          )}

          {/* Capture: the main thing on every screen. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              freeze();
            }}
            className="frost-panel mb-7 mt-2 flex items-center gap-2 rounded-2xl p-1.5 pl-4"
          >
            <input
              ref={captureRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              enterKeyHint="done"
              placeholder={here ? `New idea in ${here.name}…` : "Got an idea? Freeze it…"}
              aria-label="New idea"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {draft.trim() && (
              <button type="submit" className="ice-button shrink-0 rounded-xl px-4 py-2 text-sm font-semibold">
                Freeze
              </button>
            )}
          </form>

          {showCompartments && (
            <Section title={here ? "Inside" : "Compartments"}>
              {kids.map((c) => (
                <CompartmentRow
                  key={c.id}
                  category={c}
                  count={counts[c.id] ?? 0}
                  onOpen={() => go(c.id)}
                  onDropIdea={(id) => moveIdea(id, c.id)}
                  onDropCategory={(id) => moveCategory(id, c.id)}
                  acceptsCategory={acceptsInto(c.id)}
                />
              ))}
              {adding ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCompartment();
                  }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${here ? COLORS[here.color].dot : "bg-sky-300"}`} />
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setAdding(false);
                    }}
                    onBlur={() => {
                      if (!newName.trim()) setAdding(false);
                    }}
                    enterKeyHint="done"
                    placeholder={here ? "Sub-compartment name" : "Compartment name"}
                    aria-label="New compartment name"
                    className="min-w-0 flex-1 bg-transparent py-1 text-[15px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                  {newName.trim() && (
                    <button type="submit" className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                      Add
                    </button>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] text-slate-400 transition hover:bg-white/50 hover:text-sky-700 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-sky-300"
                >
                  <PlusIcon />
                  {here ? "New sub-compartment" : "New compartment"}
                </button>
              )}
            </Section>
          )}

          {active.length > 0 && (
            <Section title={showCompartments ? (here ? "Ideas" : "Unsorted") : undefined}>
              {active.map((i) => idea(i))}
            </Section>
          )}

          {empty && (
            <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              Nothing in here yet. Freeze an idea above.
            </p>
          )}

          {finished.length > 0 && (
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowFinished((v) => !v)}
                className="px-1 py-2 text-sm text-slate-400 hover:text-sky-700 dark:text-slate-500 dark:hover:text-sky-300"
              >
                {showFinished ? "Hide finished" : `Show finished (${finished.length})`}
              </button>
              {showFinished && <Section>{finished.map((i) => idea(i))}</Section>}
            </div>
          )}
        </>
      )}

      {openIdea && (
        <IdeaSheet
          key={openIdea.id}
          idea={openIdea}
          compartments={compartmentOptions}
          onChange={(patch) => dispatch({ type: "updateIdea", id: openIdea.id, patch })}
          onClose={closeIdea}
          onDelete={() => {
            dispatch({ type: "deleteIdea", id: openIdea.id });
            setOpenIdeaId(null);
          }}
        />
      )}

      {editingCompartment && here && (
        <CompartmentSheet
          key={here.id}
          tree={tree}
          category={here}
          onChange={(patch) => dispatch({ type: "updateCategory", id: here.id, patch })}
          onDelete={() => deleteCompartment(here)}
          onClose={closeCompartment}
        />
      )}

      {toast && (
        <div
          role="status"
          className="frost-panel fixed bottom-[calc(1.25rem+var(--safe-bottom))] left-1/2 z-40 max-w-[90vw] -translate-x-1/2 truncate rounded-full px-4 py-2 text-sm text-sky-900 shadow-lg dark:text-sky-100"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      {title && (
        <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </h3>
      )}
      <div className="frost-card divide-y divide-sky-100/80 overflow-hidden rounded-2xl dark:divide-sky-300/5">
        {children}
      </div>
    </section>
  );
}

function Menu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div role="menu" className="frost-panel absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-2xl py-1.5 shadow-xl">
        {items.map((item, n) =>
          "note" in item ? (
            <p key={n} className="mt-1 border-t border-sky-100 px-4 pb-1 pt-2.5 text-xs text-slate-400 dark:border-sky-300/10">
              {item.note}
            </p>
          ) : (
            <button
              key={n}
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                item.onSelect();
              }}
              className={`block w-full px-4 py-2.5 text-left text-[15px] hover:bg-sky-50 dark:hover:bg-white/5 ${item.danger ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </>
  );
}

function SearchResults({
  results,
  renderIdea,
  renderCompartment,
}: {
  results: { ideas: Idea[]; compartments: Category[] } | null;
  renderIdea: (i: Idea) => React.ReactNode;
  renderCompartment: (c: Category) => React.ReactNode;
}) {
  if (!results) {
    return (
      <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
        Type to search everywhere. Start with # to search tags.
      </p>
    );
  }
  if (!results.ideas.length && !results.compartments.length) {
    return <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Nothing in the freezer matches.</p>;
  }
  return (
    <div className="mt-3">
      {results.compartments.length > 0 && <Section title="Compartments">{results.compartments.map(renderCompartment)}</Section>}
      {results.ideas.length > 0 && <Section title="Ideas">{results.ideas.map(renderIdea)}</Section>}
    </div>
  );
}

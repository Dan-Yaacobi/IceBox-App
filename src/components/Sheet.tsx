"use client";

import { useEffect } from "react";

/** A bottom sheet on phones, a centred dialog on wider screens. */
export function Sheet({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="frost-panel sheet-in max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl px-5 pt-3 pb-[calc(1.25rem+var(--safe-bottom))] sm:rounded-3xl sm:pb-5"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 sm:hidden dark:bg-slate-600" />
        {children}
      </div>
    </div>
  );
}

/**
 * A pill that shows the current choice and opens the platform's native picker
 * when tapped (the real <select> sits invisibly on top).
 */
export function PillSelect({
  label,
  value,
  options,
  onChange,
  children,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-sky-200/80 bg-white/60 px-3 py-1.5 text-sm text-slate-700 focus-within:ring-2 focus-within:ring-sky-300/60 dark:border-sky-300/15 dark:bg-slate-900/40 dark:text-slate-200">
      {children}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export type Choice = { label: string; detail?: string; tone?: "danger" | "default"; onSelect: () => void };

/** A question with a few big, clearly labelled answers, plus Cancel. */
export function ChoiceSheet({
  title,
  message,
  choices,
  onClose,
}: {
  title: string;
  message?: string;
  choices: Choice[];
  onClose: () => void;
}) {
  return (
    <Sheet label={title} onClose={onClose}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      {message && <p className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>}
      <div className="mt-5 flex flex-col gap-2">
        {choices.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => {
              onClose();
              c.onSelect();
            }}
            className={`rounded-2xl px-4 py-3 text-left transition ${
              c.tone === "danger"
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-300 dark:hover:bg-rose-400/20"
                : "bg-white/70 text-slate-800 hover:bg-white dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            }`}
          >
            <span className="block text-[15px] font-semibold">{c.label}</span>
            {c.detail && <span className="mt-0.5 block text-sm opacity-75">{c.detail}</span>}
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="mt-1 rounded-2xl px-4 py-3 text-[15px] font-medium text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

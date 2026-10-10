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

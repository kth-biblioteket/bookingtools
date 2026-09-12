"use client";

import { useState } from "react";

function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * The nav's hamburger button + dropdown panel, shown only below the `sm`
 * breakpoint (the desktop nav next to it is `hidden sm:flex`) — the same
 * links/content as the desktop nav, just laid out vertically since there's
 * no room for them in a single row on a narrow screen.
 */
export function MobileNav({ menuLabel, children }: { menuLabel: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="flex items-center justify-center rounded-md p-1.5 text-white hover:bg-white/10"
      >
        {open ? <CloseIcon /> : <BurgerIcon />}
      </button>
      {open && (
        <>
          {/* Closes the menu on any tap outside it, without needing a JS click-outside listener. */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-x-0 top-full z-30 border-t border-white/10 bg-kth-navy px-4 py-3 shadow-lg"
            onClick={() => setOpen(false)}
          >
            <nav className="flex flex-col gap-3 text-sm">{children}</nav>
          </div>
        </>
      )}
    </div>
  );
}

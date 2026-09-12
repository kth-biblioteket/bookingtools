/** Small icons for a room's capacity and equipment, shared by both schedule layouts. */

export function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20a4 4 0 0 0-3-3.87M9 20H4v-1a4 4 0 0 1 4-4h1m5-3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3 8v-1a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1"
      />
    </svg>
  );
}

export function ScreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 shrink-0">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}

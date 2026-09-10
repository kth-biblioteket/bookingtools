"use client";

import { useTransition } from "react";

export function ConfirmButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (bookingId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(bookingId))}
      className="text-xs font-medium text-green-700 hover:underline disabled:opacity-60"
    >
      {pending ? "Bekräftar…" : "Bekräfta"}
    </button>
  );
}

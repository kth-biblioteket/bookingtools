"use client";

import { useState, useTransition } from "react";

export function CancelButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (bookingId: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-gray-600">Säker?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => action(bookingId))}
          className="font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {pending ? "Avbokar…" : "Ja, avboka"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:underline"
        >
          Avbryt
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-600 hover:underline"
    >
      Avboka
    </button>
  );
}

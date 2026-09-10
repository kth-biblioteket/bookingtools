"use client";

import { useState, useTransition } from "react";

export function DeleteRoomButton({
  roomId,
  action,
}: {
  roomId: string;
  action: (roomId: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-gray-600">
          Säker? Tar bort rummet och alla dess bokningar.
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => action(roomId))}
          className="font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {pending ? "Tar bort…" : "Ja, ta bort"}
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
      Ta bort
    </button>
  );
}

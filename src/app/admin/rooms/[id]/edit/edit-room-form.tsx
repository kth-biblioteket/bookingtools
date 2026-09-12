"use client";

import { useActionState } from "react";
import { updateRoom } from "../../actions";
import type { Room } from "@/generated/prisma/client";

export function EditRoomForm({ room }: { room: Room }) {
  const [state, formAction, pending] = useActionState(updateRoom, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="roomId" value={room.id} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Namn
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={room.name}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
          Rumsnummer (för sortering)
        </label>
        <input
          id="roomNumber"
          name="roomNumber"
          type="number"
          required
          defaultValue={room.roomNumber}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="building" className="block text-sm font-medium text-gray-700">
          Byggnad
        </label>
        <input
          id="building"
          name="building"
          type="text"
          required
          maxLength={100}
          defaultValue={room.building}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="campus" className="block text-sm font-medium text-gray-700">
          Campus
        </label>
        <input
          id="campus"
          name="campus"
          type="text"
          required
          maxLength={100}
          defaultValue={room.campus}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
          Kapacitet
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          required
          min={1}
          defaultValue={room.capacity}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
          Våning (valfritt)
        </label>
        <input
          id="floor"
          name="floor"
          type="text"
          maxLength={100}
          defaultValue={room.floor ?? ""}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="hasScreen"
          defaultChecked={room.hasScreen}
          className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
        />
        Har skärm
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="hasWhiteboard"
          defaultChecked={room.hasWhiteboard}
          className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
        />
        Har whiteboard
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Spara ändringar"}
      </button>
    </form>
  );
}

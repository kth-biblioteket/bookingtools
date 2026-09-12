"use client";

import { useActionState, useEffect, useState } from "react";
import { createRoom } from "./actions";
import { useI18n } from "@/components/i18n-provider";

export function NewRoomForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createRoom, undefined);
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    if (state?.success) {
      setSuccessCount((count) => count + 1);
    }
  }, [state?.success]);

  return (
    <form key={successCount} action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.roomNumber")}
        </label>
        <input
          id="roomNumber"
          name="roomNumber"
          type="number"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="building" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.building")}
        </label>
        <input
          id="building"
          name="building"
          type="text"
          required
          maxLength={100}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="campus" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.campus")}
        </label>
        <input
          id="campus"
          name="campus"
          type="text"
          required
          maxLength={100}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.capacity")}
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          required
          min={1}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="floor" className="block text-sm font-medium text-gray-700">
          {t("adminRooms.floorOptional")}
        </label>
        <input
          id="floor"
          name="floor"
          type="text"
          maxLength={100}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="hasScreen"
          className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
        />
        {t("adminRooms.hasScreen")}
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="hasWhiteboard"
          className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
        />
        {t("adminRooms.hasWhiteboard")}
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
      >
        {pending ? t("adminRooms.addSubmitPending") : t("adminRooms.addSubmit")}
      </button>
    </form>
  );
}

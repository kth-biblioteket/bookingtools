"use client";

import { useActionState } from "react";
import { updateSettings } from "./actions";
import type { AppSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(updateSettings, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="minMinutes" className="block text-sm font-medium text-gray-700">
          Minsta bokningslängd (minuter)
        </label>
        <input
          id="minMinutes"
          name="minMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.minMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>
      <div>
        <label htmlFor="maxMinutes" className="block text-sm font-medium text-gray-700">
          Längsta bokningslängd (minuter)
        </label>
        <input
          id="maxMinutes"
          name="maxMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.maxMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>
      <div>
        <label htmlFor="stepMinutes" className="block text-sm font-medium text-gray-700">
          Bokningsintervall (minuter)
        </label>
        <input
          id="stepMinutes"
          name="stepMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.stepMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>
      <div>
        <label htmlFor="scheduleLayout" className="block text-sm font-medium text-gray-700">
          Schemavy
        </label>
        <select
          id="scheduleLayout"
          name="scheduleLayout"
          required
          defaultValue={settings.scheduleLayout}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          <option value="horizontal">Rum som rader, tid horisontellt</option>
          <option value="vertical">Rum som kolumner, tid vertikalt</option>
        </select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Spara"}
      </button>
    </form>
  );
}

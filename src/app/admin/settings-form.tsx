"use client";

import { useActionState, useState } from "react";
import { updateSettings } from "./actions";
import type { AppSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(updateSettings, undefined);
  const [requireConfirmation, setRequireConfirmation] = useState(
    settings.requirePreliminaryConfirmation
  );

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
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
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
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
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
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
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
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        >
          <option value="horizontal">Rum som rader, tid horisontellt</option>
          <option value="vertical">Rum som kolumner, tid vertikalt</option>
        </select>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="requirePreliminaryConfirmation"
            checked={requireConfirmation}
            onChange={(e) => setRequireConfirmation(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
          />
          Bokningar är preliminära och måste bekräftas
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Om aktiverat: en ny bokning är preliminär (gul) tills den bekräftas av den
          som bokade, inom fönstret nedan (orange). Bekräftas den inte i tid frigörs
          tiden automatiskt. Bekräftade bokningar visas röda.
        </p>

        {requireConfirmation && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="confirmMinutesBefore"
                className="block text-sm font-medium text-gray-700"
              >
                Minuter innan start
              </label>
              <input
                id="confirmMinutesBefore"
                name="confirmMinutesBefore"
                type="number"
                required
                min={0}
                defaultValue={settings.confirmMinutesBefore}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
              />
            </div>
            <div>
              <label
                htmlFor="confirmMinutesAfter"
                className="block text-sm font-medium text-gray-700"
              >
                Minuter efter start
              </label>
              <input
                id="confirmMinutesAfter"
                name="confirmMinutesAfter"
                type="number"
                required
                min={0}
                defaultValue={settings.confirmMinutesAfter}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
              />
            </div>
          </div>
        )}
        {!requireConfirmation && (
          <>
            <input type="hidden" name="confirmMinutesBefore" value={settings.confirmMinutesBefore} />
            <input type="hidden" name="confirmMinutesAfter" value={settings.confirmMinutesAfter} />
          </>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
      >
        {pending ? "Sparar…" : "Spara"}
      </button>
    </form>
  );
}

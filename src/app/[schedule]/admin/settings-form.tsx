"use client";

import { useActionState, useState } from "react";
import { updateSettings } from "./actions";
import type { AppSettings, OpeningHoursDay } from "@/lib/settings";
import { getWeekDates, weekdayLabel } from "@/lib/date";
import { useI18n } from "@/components/i18n-provider";

/** A reference Mon–Sun week purely to get locale-correct weekday names from
 * — the actual dates don't matter, only which day of the week each is. */
const REFERENCE_WEEK = getWeekDates(new Date().toISOString().slice(0, 10));

export function SettingsForm({
  scheduleSlug,
  settings,
  openingHours,
}: {
  scheduleSlug: string;
  settings: AppSettings;
  openingHours: OpeningHoursDay[];
}) {
  const { t, locale } = useI18n();
  const [state, formAction, pending] = useActionState(updateSettings, undefined);
  const [requireConfirmation, setRequireConfirmation] = useState(
    settings.requirePreliminaryConfirmation
  );
  const [closedDays, setClosedDays] = useState(() => openingHours.map((d) => d.closed));
  // The form's inputs use defaultValue (uncontrolled), which only applies on
  // mount — it doesn't pick up a later change to the `settings` prop. After
  // a successful save, revalidatePath causes the server to re-fetch settings
  // and pass a new `settings` prop down, but without a remount the form just
  // keeps showing whatever it displayed before — the save "wins" in the
  // database but visually looks undone. Keying the form directly on the
  // settings values (rather than on the action's success flag, which can
  // resolve a render tick before the fresh prop actually arrives) guarantees
  // it remounts exactly when — and only when — the underlying data changes.
  const settingsKey = JSON.stringify({ settings, openingHours });

  return (
    <form key={settingsKey} action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="scheduleSlug" value={scheduleSlug} />
      <div>
        <label htmlFor="minMinutes" className="block text-sm font-medium text-gray-700">
          {t("admin.minMinutes")}
        </label>
        <input
          id="minMinutes"
          name="minMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.minMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="maxMinutes" className="block text-sm font-medium text-gray-700">
          {t("admin.maxMinutes")}
        </label>
        <input
          id="maxMinutes"
          name="maxMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.maxMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="stepMinutes" className="block text-sm font-medium text-gray-700">
          {t("admin.stepMinutes")}
        </label>
        <input
          id="stepMinutes"
          name="stepMinutes"
          type="number"
          required
          min={15}
          step={15}
          defaultValue={settings.stepMinutes}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="scheduleLayout" className="block text-sm font-medium text-gray-700">
          {t("admin.scheduleLayout")}
        </label>
        <select
          id="scheduleLayout"
          name="scheduleLayout"
          required
          defaultValue={settings.scheduleLayout}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        >
          <option value="horizontal">{t("admin.layoutHorizontal")}</option>
          <option value="vertical">{t("admin.layoutVertical")}</option>
        </select>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-medium text-gray-700">{t("admin.openingHours")}</p>
        <p className="mt-1 text-xs text-gray-500">{t("admin.openingHoursHint")}</p>
        <div className="mt-3 flex flex-col gap-2">
          {openingHours.map((day) => {
            const closed = closedDays[day.weekday];
            return (
              <div key={day.weekday} className="flex flex-wrap items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium capitalize text-gray-700">
                  {weekdayLabel(REFERENCE_WEEK[day.weekday], locale)}
                </span>
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    name={`closed-${day.weekday}`}
                    checked={closed}
                    onChange={(e) =>
                      setClosedDays((prev) => {
                        const next = [...prev];
                        next[day.weekday] = e.target.checked;
                        return next;
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-kth-blue focus:ring-kth-blue"
                  />
                  {t("admin.closedAllDay")}
                </label>
                {!closed && (
                  <>
                    <input
                      type="number"
                      aria-label={t("admin.dayStartHour")}
                      name={`startHour-${day.weekday}`}
                      required
                      min={0}
                      max={23}
                      defaultValue={day.startHour}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
                    />
                    <span className="text-sm text-gray-500">–</span>
                    <input
                      type="number"
                      aria-label={t("admin.dayEndHour")}
                      name={`endHour-${day.weekday}`}
                      required
                      min={1}
                      max={24}
                      defaultValue={day.endHour}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
                    />
                  </>
                )}
                {closed && (
                  <>
                    <input type="hidden" name={`startHour-${day.weekday}`} value={day.startHour} />
                    <input type="hidden" name={`endHour-${day.weekday}`} value={day.endHour} />
                  </>
                )}
              </div>
            );
          })}
        </div>
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
          {t("admin.requireConfirmation")}
        </label>
        <p className="mt-1 text-xs text-gray-500">{t("admin.requireConfirmationHint")}</p>

        {requireConfirmation && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="confirmMinutesBefore"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.minutesBefore")}
              </label>
              <input
                id="confirmMinutesBefore"
                name="confirmMinutesBefore"
                type="number"
                required
                min={0}
                defaultValue={settings.confirmMinutesBefore}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
              />
            </div>
            <div>
              <label
                htmlFor="confirmMinutesAfter"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.minutesAfter")}
              </label>
              <input
                id="confirmMinutesAfter"
                name="confirmMinutesAfter"
                type="number"
                required
                min={0}
                defaultValue={settings.confirmMinutesAfter}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
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
        {pending ? t("admin.saving") : t("admin.save")}
      </button>
    </form>
  );
}

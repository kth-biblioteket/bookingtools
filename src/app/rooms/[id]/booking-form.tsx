"use client";

import { useActionState, useEffect, useMemo } from "react";
import { createBooking, updateBooking } from "./actions";
import type { BookingSettings } from "@/lib/settings";
import { useI18n } from "@/components/i18n-provider";

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeLabel(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export type FormMode = "create" | "edit";

export function BookingForm({
  roomId,
  date,
  slots,
  settings,
  mode,
  editingBookingId,
  title,
  startTime,
  endTime,
  onTitleChange,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateSuccess,
  onCreateSuccess,
  holdError,
}: {
  roomId: string;
  date: string;
  slots: string[];
  settings: BookingSettings;
  mode: FormMode;
  editingBookingId?: string;
  title: string;
  startTime: string;
  endTime: string;
  onTitleChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onCancelEdit: () => void;
  onUpdateSuccess: () => void;
  onCreateSuccess: () => void;
  /** Set when someone else already grabbed this slot's hold — blocks submission. */
  holdError?: string;
}) {
  const { t } = useI18n();
  const action = mode === "edit" ? updateBooking : createBooking;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (!state?.success) return;
    if (mode === "edit") {
      onUpdateSuccess();
    } else {
      onCreateSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const startOptions = useMemo(
    () => slots.filter((s) => toMinutes(s) % settings.stepMinutes === 0),
    [slots, settings.stepMinutes]
  );

  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startMinutes = toMinutes(startTime);
    const options: string[] = [];
    for (
      let duration = settings.minMinutes;
      duration <= settings.maxMinutes;
      duration += settings.stepMinutes
    ) {
      options.push(toTimeLabel(startMinutes + duration));
    }
    return options;
  }, [startTime, settings.minMinutes, settings.maxMinutes, settings.stepMinutes]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" ? (
        <input type="hidden" name="bookingId" value={editingBookingId} />
      ) : (
        <input type="hidden" name="roomId" value={roomId} />
      )}
      <input type="hidden" name="date" value={date} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t("bookingForm.purpose")}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("bookingForm.purposePlaceholder")}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            {t("bookingForm.from")}
          </label>
          <select
            id="startTime"
            name="startTime"
            required
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          >
            <option value="" disabled>
              {t("bookingForm.pickTime")}
            </option>
            {startOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            {t("bookingForm.to")}
          </label>
          <select
            id="endTime"
            name="endTime"
            key={startTime}
            required
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            disabled={!startTime}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue disabled:bg-gray-50"
          >
            <option value="" disabled>
              {t("bookingForm.pickTime")}
            </option>
            {endOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {holdError && <p className="text-sm text-red-600">{holdError}</p>}
      {!holdError && state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !!holdError}
          className="rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
        >
          {mode === "edit"
            ? pending
              ? t("bookingForm.submitEditPending")
              : t("bookingForm.submitEdit")
            : pending
              ? t("bookingForm.submitCreatePending")
              : t("bookingForm.submitCreate")}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-sm font-medium text-gray-600 hover:underline"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

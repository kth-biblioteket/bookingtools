"use client";

import { useActionState, useEffect, useMemo, useTransition } from "react";
import { createBooking, updateBooking, cancelBooking, confirmBooking } from "@/app/rooms/[id]/actions";
import { CancelButton } from "@/components/cancel-button";
import type { BookingSettings } from "@/lib/settings";
import { useI18n } from "@/components/i18n-provider";

export type ScheduleFormMode = "create" | "edit";

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeLabel(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function ScheduleBookingPanel({
  date,
  settings,
  dayStartHour,
  dayEndHour,
  mode,
  selectedRoom,
  editingBookingId,
  editingBookingConfirmedAt,
  title,
  startTime,
  endTime,
  holdError,
  onTitleChange,
  onStartTimeChange,
  onEndTimeChange,
  onCancelEdit,
  onUpdateSuccess,
  onCreateSuccess,
}: {
  date: string;
  settings: BookingSettings;
  dayStartHour: number;
  dayEndHour: number;
  mode: ScheduleFormMode;
  selectedRoom: { id: string; name: string };
  editingBookingId?: string;
  editingBookingConfirmedAt?: Date | null;
  title: string;
  startTime: string;
  endTime: string;
  /** Set when someone else has already booked or is holding this slot
   * (from the create-mode hold heartbeat in schedule-board.tsx). Blocks
   * submission until it clears. */
  holdError?: string;
  onTitleChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onCancelEdit: () => void;
  onUpdateSuccess: () => void;
  onCreateSuccess: () => void;
}) {
  const { t } = useI18n();
  const action = mode === "edit" ? updateBooking : createBooking;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [confirmPending, startConfirmTransition] = useTransition();

  const needsConfirmation =
    mode === "edit" &&
    settings.requirePreliminaryConfirmation &&
    editingBookingConfirmedAt === null;

  useEffect(() => {
    if (!state?.success) return;
    if (mode === "edit") {
      onUpdateSuccess();
    } else {
      onCreateSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const startOptions = useMemo(() => {
    const options: string[] = [];
    const totalMinutes = (dayEndHour - dayStartHour) * 60;
    for (let m = 0; m < totalMinutes; m += settings.stepMinutes) {
      options.push(toTimeLabel(dayStartHour * 60 + m));
    }
    return options;
  }, [dayStartHour, dayEndHour, settings.stepMinutes]);

  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startMinutes = toMinutes(startTime);
    const maxOfDay = dayEndHour * 60;
    const options: string[] = [];
    for (
      let duration = settings.minMinutes;
      duration <= settings.maxMinutes;
      duration += settings.stepMinutes
    ) {
      const end = startMinutes + duration;
      if (end > maxOfDay) break;
      options.push(toTimeLabel(end));
    }
    return options;
  }, [startTime, settings.minMinutes, settings.maxMinutes, settings.stepMinutes, dayEndHour]);

  return (
    <div>
      <h2 className="mb-4 text-base font-medium text-gray-700">
        {mode === "edit" ? t("roomDetail.editTitle") : t("roomDetail.bookTitle")}
        {" – "}
        <span className="font-semibold text-gray-900">{selectedRoom.name}</span>
      </h2>
      <form action={formAction} className="flex flex-col gap-4">
        {mode === "edit" ? (
          <input type="hidden" name="bookingId" value={editingBookingId} />
        ) : (
          <input type="hidden" name="roomId" value={selectedRoom.id} />
        )}
        <input type="hidden" name="date" value={date} />

        <div>
          <label htmlFor="schedule-title" className="block text-sm font-medium text-gray-700">
            {t("bookingForm.purpose")}
          </label>
          <input
            id="schedule-title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t("bookingForm.purposePlaceholder")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="schedule-startTime" className="block text-sm font-medium text-gray-700">
              {t("bookingForm.from")}
            </label>
            <select
              id="schedule-startTime"
              name="startTime"
              required
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
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
            <label htmlFor="schedule-endTime" className="block text-sm font-medium text-gray-700">
              {t("bookingForm.to")}
            </label>
            <select
              id="schedule-endTime"
              name="endTime"
              key={startTime}
              required
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              disabled={!startTime}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue disabled:bg-gray-50"
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
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
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
          {needsConfirmation && editingBookingId && (
            <button
              type="button"
              disabled={confirmPending}
              onClick={() =>
                startConfirmTransition(async () => {
                  await confirmBooking(editingBookingId);
                  onUpdateSuccess();
                })
              }
              className="text-xs font-medium text-green-700 hover:underline disabled:opacity-60"
            >
              {confirmPending ? t("bookingStatus.confirmPending") : t("bookingStatus.confirm")}
            </button>
          )}
          {mode === "edit" && editingBookingId && (
            <CancelButton
              bookingId={editingBookingId}
              action={async (id) => {
                await cancelBooking(id);
                onUpdateSuccess();
              }}
            />
          )}
        </div>
      </form>
    </div>
  );
}

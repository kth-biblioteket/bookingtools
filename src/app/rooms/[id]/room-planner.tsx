"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookingForm, type FormMode } from "./booking-form";
import { CancelButton } from "@/components/cancel-button";
import { ConfirmButton } from "@/components/confirm-button";
import { cancelBooking, confirmBooking, releaseMyHold, requestHold } from "./actions";
import { getBookingConfirmationStatus } from "@/lib/booking-status";
import { RoomWeekVertical } from "@/components/room-week-vertical";
import type { getBookingsForRoomInRange, generateDaySlots } from "@/lib/booking";
import type { BookingSettings } from "@/lib/settings";
import type { ActiveHold } from "@/lib/booking-hold";
import { useI18n } from "@/components/i18n-provider";

/** How often to renew our hold while the booking form is open, safely under HOLD_TTL_MS. */
const HOLD_HEARTBEAT_MS = 20_000;
/** Debounce before renewing the hold after the user changes the start/end time. */
const HOLD_RENEW_DEBOUNCE_MS = 500;

type Booking = Awaited<ReturnType<typeof getBookingsForRoomInRange>>[number];
type Slot = ReturnType<typeof generateDaySlots>[number];

function toTimeLabel(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeLabelFromDate(d: Date) {
  return d.toTimeString().slice(0, 5);
}

function dateStrFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RoomPlanner({
  roomId,
  weekDates,
  todayStr,
  bookingsByDate,
  holdsByDate,
  slots,
  settings,
  currentUserId,
  isAdmin,
  dayStartHour,
  dayEndHour,
}: {
  roomId: string;
  /** The current Mon–Sun week, as ISO date strings. */
  weekDates: string[];
  todayStr: string;
  bookingsByDate: Record<string, Booking[]>;
  holdsByDate: Record<string, ActiveHold[]>;
  slots: Slot[];
  settings: BookingSettings;
  currentUserId: string;
  /** Admins see every booking's real title, not just its status — see the
   * "Bokat"/"Upptaget" masking below. */
  isAdmin: boolean;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [formDate, setFormDate] = useState(todayStr);
  const [editingBookingId, setEditingBookingId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [holdError, setHoldError] = useState<string | undefined>();
  const [, startHoldTransition] = useTransition();

  // Whether we currently need a hold: only while the create form has a real,
  // free slot picked out (editing an own existing booking doesn't need one).
  const holdActiveRef = useRef(false);
  const latestHoldRequestRef = useRef({ roomId, date: formDate, startTime, endTime });
  latestHoldRequestRef.current = { roomId, date: formDate, startTime, endTime };

  // Request/renew the hold whenever the picked slot changes, and release it
  // once the user is no longer trying to book a new free slot.
  useEffect(() => {
    const isActive = formOpen && mode === "create" && !!startTime && !!endTime;
    const wasActive = holdActiveRef.current;
    holdActiveRef.current = isActive;

    if (!isActive) {
      setHoldError(undefined);
      if (wasActive) {
        startHoldTransition(async () => {
          await releaseMyHold();
        });
      }
      return;
    }

    const timeout = setTimeout(() => {
      startHoldTransition(async () => {
        const result = await requestHold(roomId, formDate, startTime, endTime);
        setHoldError(result?.error);
      });
    }, HOLD_RENEW_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, mode, startTime, endTime, roomId, formDate]);

  // Heartbeat: renew the hold periodically using the latest form values, well
  // under the server-side TTL, so a long-open form doesn't silently expire.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!holdActiveRef.current) return;
      const current = latestHoldRequestRef.current;
      startHoldTransition(async () => {
        const result = await requestHold(
          current.roomId,
          current.date,
          current.startTime,
          current.endTime
        );
        setHoldError(result?.error);
      });
    }, HOLD_HEARTBEAT_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: release our hold if the component unmounts while one is active
  // (e.g. navigating away without cancelling first).
  useEffect(() => {
    return () => {
      if (holdActiveRef.current) {
        releaseMyHold();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the modal on Escape while it's open.
  useEffect(() => {
    if (!formOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") resetForm();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  function resetForm() {
    if (mode === "create" && formOpen) {
      void releaseMyHold();
    }
    setFormOpen(false);
    setMode("create");
    setFormDate(todayStr);
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setHoldError(undefined);
  }

  function handleFreeSlotClick(dateStr: string, start: Date) {
    const clickedMinutes = start.getHours() * 60 + start.getMinutes();
    const alignedStart = Math.floor(clickedMinutes / settings.stepMinutes) * settings.stepMinutes;
    setMode("create");
    setFormDate(dateStr);
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime(toTimeLabel(alignedStart));
    setEndTime(toTimeLabel(alignedStart + settings.minMinutes));
    setFormOpen(true);
  }

  function handleEditClick(booking: Booking) {
    setMode("edit");
    setFormDate(dateStrFromDate(booking.startTime));
    setEditingBookingId(booking.id);
    setTitle(booking.title);
    setStartTime(timeLabelFromDate(booking.startTime));
    setEndTime(timeLabelFromDate(booking.endTime));
    setFormOpen(true);
  }

  const weekBookings = weekDates
    .flatMap((date) => bookingsByDate[date] ?? [])
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">{t("roomDetail.scheduleHeading")}</h2>
      <RoomWeekVertical
        weekDates={weekDates}
        bookingsByDate={bookingsByDate}
        holdsByDate={holdsByDate}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        todayStr={todayStr}
        dayStartHour={dayStartHour}
        dayEndHour={dayEndHour}
        stepMinutes={settings.stepMinutes}
        settings={settings}
        onFreeClick={handleFreeSlotClick}
        onOwnBookingClick={(_date, booking) => handleEditClick(booking)}
      />

      {weekBookings.length > 0 && (
        <div className="mt-4 space-y-2">
          {weekBookings.map((b) => {
            const isOwn = b.userId === currentUserId;
            const confirmationStatus = getBookingConfirmationStatus(b, settings);
            const needsConfirm =
              confirmationStatus === "preliminary" || confirmationStatus === "needs_confirmation";
            const statusDotColor =
              confirmationStatus === "preliminary"
                ? "bg-yellow-400"
                : confirmationStatus === "needs_confirmation"
                  ? "bg-orange-500"
                  : "bg-red-500";
            const statusLabel =
              confirmationStatus === "preliminary"
                ? t("bookingStatus.preliminary")
                : confirmationStatus === "needs_confirmation"
                  ? t("bookingStatus.needsConfirmation")
                  : t("bookingStatus.confirmed");
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotColor}`}
                    title={statusLabel}
                  />
                  {dateStrFromDate(b.startTime)} {timeLabelFromDate(b.startTime)}–{timeLabelFromDate(b.endTime)}{" "}
                  {isOwn
                    ? `· ${b.title} ${t("roomDetail.ownSuffix")}`
                    : isAdmin
                      ? `· ${b.title} (${b.user.name})`
                      : confirmationStatus === "confirmed"
                        ? `· ${t("roomDetail.occupiedLabel")}`
                        : `· ${t("roomDetail.bookedLabel")}`}
                </span>
                {isOwn && (
                  <span className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleEditClick(b)}
                      className="text-xs font-medium text-kth-blue hover:underline"
                    >
                      {t("roomDetail.editTime")}
                    </button>
                    {needsConfirm && <ConfirmButton bookingId={b.id} action={confirmBooking} />}
                    <CancelButton bookingId={b.id} action={cancelBooking} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={resetForm}>
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={resetForm}
              aria-label={t("roomDetail.close")}
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-base font-medium text-gray-700">
              {mode === "edit" ? t("roomDetail.editTitle") : t("roomDetail.bookTitle")}
            </h2>
            <BookingForm
              roomId={roomId}
              date={formDate}
              slots={slots.map((s) => s.label)}
              settings={settings}
              mode={mode}
              editingBookingId={editingBookingId}
              title={title}
              startTime={startTime}
              endTime={endTime}
              onTitleChange={setTitle}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onCancelEdit={resetForm}
              onUpdateSuccess={resetForm}
              onCreateSuccess={resetForm}
              holdError={mode === "create" ? holdError : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

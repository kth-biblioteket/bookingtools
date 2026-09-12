"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BookingForm, type FormMode } from "./booking-form";
import { CancelButton } from "@/components/cancel-button";
import { ConfirmButton } from "@/components/confirm-button";
import { cancelBooking, confirmBooking, releaseMyHold, requestHold } from "./actions";
import { getBookingConfirmationStatus } from "@/lib/booking-status";
import type { getBookingsForRoomOnDate, generateDaySlots } from "@/lib/booking";
import type { BookingSettings } from "@/lib/settings";
import type { ActiveHold } from "@/lib/booking-hold";

/** How often to renew our hold while the booking form is open, safely under HOLD_TTL_MS. */
const HOLD_HEARTBEAT_MS = 20_000;
/** Debounce before renewing the hold after the user changes the start/end time. */
const HOLD_RENEW_DEBOUNCE_MS = 500;

type Booking = Awaited<ReturnType<typeof getBookingsForRoomOnDate>>[number];
type Slot = ReturnType<typeof generateDaySlots>[number];

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeLabel(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeLabelFromDate(d: Date) {
  return d.toTimeString().slice(0, 5);
}

export function RoomPlanner({
  roomId,
  date,
  bookings,
  slots,
  settings,
  currentUserId,
  holds,
}: {
  roomId: string;
  date: string;
  bookings: Booking[];
  slots: Slot[];
  settings: BookingSettings;
  currentUserId: string;
  holds: ActiveHold[];
}) {
  const [mode, setMode] = useState<FormMode>("create");
  const [editingBookingId, setEditingBookingId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | undefined>();
  const [holdError, setHoldError] = useState<string | undefined>();
  const [, startHoldTransition] = useTransition();

  const formSectionRef = useRef<HTMLDivElement>(null);
  const bookingRefs = useRef(new Map<string, HTMLDivElement>());

  // Whether we currently need a hold: only while the create form has a real,
  // free slot picked out (editing an own existing booking doesn't need one).
  const holdActiveRef = useRef(false);
  const latestHoldRequestRef = useRef({ roomId, date, startTime, endTime });
  latestHoldRequestRef.current = { roomId, date, startTime, endTime };

  // Request/renew the hold whenever the picked slot changes, and release it
  // once the user is no longer trying to book a new free slot.
  useEffect(() => {
    const isActive = mode === "create" && !!startTime && !!endTime;
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
        const result = await requestHold(roomId, date, startTime, endTime);
        setHoldError(result?.error);
      });
    }, HOLD_RENEW_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startTime, endTime, roomId, date]);

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

  function scrollToForm() {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function scrollToBooking(id: string) {
    bookingRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleFreeSlotClick(slot: Slot) {
    const clickedMinutes = toMinutes(slot.label);
    const alignedStart = Math.floor(clickedMinutes / settings.stepMinutes) * settings.stepMinutes;
    setMode("create");
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime(toTimeLabel(alignedStart));
    setEndTime(toTimeLabel(alignedStart + settings.minMinutes));
    setHighlightedBookingId(undefined);
    scrollToForm();
  }

  function handleOwnSlotClick(booking: Booking) {
    setHighlightedBookingId(booking.id);
    scrollToBooking(booking.id);
  }

  function handleEditClick(booking: Booking) {
    setMode("edit");
    setEditingBookingId(booking.id);
    setTitle(booking.title);
    setStartTime(timeLabelFromDate(booking.startTime));
    setEndTime(timeLabelFromDate(booking.endTime));
    scrollToForm();
  }

  function handleCancelEdit() {
    setMode("create");
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime("");
    setEndTime("");
  }

  function handleUpdateSuccess() {
    setMode("create");
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime("");
    setEndTime("");
  }

  function handleCreateSuccess() {
    setTitle("");
    setStartTime("");
    setEndTime("");
  }

  const slotStatus = slots.map((slot) => {
    const booking = bookings.find((b) => b.startTime < slot.end && b.endTime > slot.start);
    const heldByOther =
      !booking &&
      holds.some(
        (hold) =>
          hold.userId !== currentUserId && hold.startTime < slot.end && hold.endTime > slot.start
      );
    return { ...slot, booking, heldByOther };
  });

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-700">Schema för dagen</h2>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {slotStatus.map((slot) => {
            const isOwn = slot.booking?.userId === currentUserId;
            const isPast = slot.start < new Date();
            const isPastFree = !slot.booking && isPast;
            const clickable = (!slot.booking || isOwn) && !isPastFree && !slot.heldByOther;
            const isHighlighted = slot.booking && slot.booking.id === highlightedBookingId;
            const confirmationStatus = slot.booking
              ? getBookingConfirmationStatus(slot.booking, settings)
              : undefined;
            const statusColor =
              confirmationStatus === "preliminary"
                ? "bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
                : confirmationStatus === "needs_confirmation"
                  ? "bg-orange-100 text-orange-900 hover:bg-orange-200"
                  : confirmationStatus === "confirmed"
                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                    : "";
            return (
              <button
                type="button"
                key={slot.label}
                disabled={!clickable}
                onClick={() => {
                  if (!slot.booking && !slot.heldByOther) handleFreeSlotClick(slot);
                  else if (isOwn && slot.booking) handleOwnSlotClick(slot.booking);
                }}
                title={
                  slot.booking
                    ? isOwn
                      ? `Din bokning: ${slot.booking.title}`
                      : `Bokat: ${slot.booking.title}`
                    : slot.heldByOther
                      ? "Någon bokar den här tiden just nu"
                      : isPastFree
                        ? "Har passerat"
                        : "Ledigt – klicka för att boka"
                }
                className={`rounded px-1 py-1.5 text-center text-xs transition ${
                  slot.booking
                    ? `${isOwn ? "cursor-pointer" : "cursor-default"} ${statusColor} ${
                        isOwn ? `ring-2 ${isHighlighted ? "ring-kth-sky" : "ring-kth-sky"}` : ""
                      }`
                    : slot.heldByOther
                      ? "cursor-not-allowed border border-dashed border-gray-400 bg-[repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_4px,#dbeafe_4px,#dbeafe_8px)] text-gray-500"
                      : isPastFree
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "cursor-pointer bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>

        {bookings.length > 0 && (
          <div className="mt-4 space-y-2">
            {bookings.map((b) => {
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
                  ? "Preliminär"
                  : confirmationStatus === "needs_confirmation"
                    ? "Väntar på bekräftelse"
                    : "Bekräftad";
              return (
                <div
                  key={b.id}
                  ref={(el) => {
                    if (el) bookingRefs.current.set(b.id, el);
                    else bookingRefs.current.delete(b.id);
                  }}
                  className={`flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm transition ${
                    highlightedBookingId === b.id ? "border-kth-sky ring-2 ring-kth-light-blue" : "border-gray-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusDotColor}`}
                      title={statusLabel}
                    />
                    {timeLabelFromDate(b.startTime)}–{timeLabelFromDate(b.endTime)}{" "}
                    {isOwn ? `· ${b.title} (du)` : "· Bokat"}
                  </span>
                  {isOwn && (
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditClick(b)}
                        className="text-xs font-medium text-kth-blue hover:underline"
                      >
                        Ändra tid
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
      </div>

      <div ref={formSectionRef}>
        <h2 className="mb-2 text-sm font-medium text-gray-700">
          {mode === "edit" ? "Ändra bokning" : "Boka en tid"}
        </h2>
        <BookingForm
          roomId={roomId}
          date={date}
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
          onCancelEdit={handleCancelEdit}
          onUpdateSuccess={handleUpdateSuccess}
          onCreateSuccess={handleCreateSuccess}
          holdError={mode === "create" ? holdError : undefined}
        />
      </div>
    </div>
  );
}

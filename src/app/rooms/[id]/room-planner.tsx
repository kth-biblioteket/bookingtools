"use client";

import { useRef, useState } from "react";
import { BookingForm, type FormMode } from "./booking-form";
import { CancelButton } from "@/components/cancel-button";
import { ConfirmButton } from "@/components/confirm-button";
import { cancelBooking, confirmBooking } from "./actions";
import { getBookingConfirmationStatus } from "@/lib/booking-status";
import type { getBookingsForRoomOnDate, generateDaySlots } from "@/lib/booking";
import type { BookingSettings } from "@/lib/settings";

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
}: {
  roomId: string;
  date: string;
  bookings: Booking[];
  slots: Slot[];
  settings: BookingSettings;
  currentUserId: string;
}) {
  const [mode, setMode] = useState<FormMode>("create");
  const [editingBookingId, setEditingBookingId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | undefined>();

  const formSectionRef = useRef<HTMLDivElement>(null);
  const bookingRefs = useRef(new Map<string, HTMLDivElement>());

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
    return { ...slot, booking };
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
            const clickable = (!slot.booking || isOwn) && !isPastFree;
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
                  if (!slot.booking) handleFreeSlotClick(slot);
                  else if (isOwn) handleOwnSlotClick(slot.booking);
                }}
                title={
                  slot.booking
                    ? isOwn
                      ? `Din bokning: ${slot.booking.title}`
                      : `Bokat: ${slot.booking.title}`
                    : isPastFree
                      ? "Har passerat"
                      : "Ledigt – klicka för att boka"
                }
                className={`rounded px-1 py-1.5 text-center text-xs transition ${
                  slot.booking
                    ? `${isOwn ? "cursor-pointer" : "cursor-default"} ${statusColor} ${
                        isOwn ? `ring-2 ${isHighlighted ? "ring-blue-500" : "ring-blue-400"}` : ""
                      }`
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
                    highlightedBookingId === b.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
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
                        className="text-xs font-medium text-blue-700 hover:underline"
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
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RoomTimeline, type TimelineBooking } from "@/components/room-timeline";
import { ScheduleVertical } from "@/components/schedule-vertical";
import { ScheduleBookingPanel, type ScheduleFormMode } from "./schedule-booking-panel";
import { requestHold, releaseMyHold } from "@/app/rooms/[id]/actions";
import type { getAllRoomsBookingsForDate } from "@/lib/booking";
import type { ActiveHold } from "@/lib/booking-hold";
import type { BookingSettings, ScheduleLayout } from "@/lib/settings";

/** Heartbeat interval for renewing the calling user's hold while the booking
 * modal stays open. Kept safely under HOLD_TTL_MS (60s) so a slow tick or a
 * dropped request doesn't let the hold lapse before the next renewal. */
const HOLD_HEARTBEAT_MS = 20000;
/** Debounce for re-requesting a hold right after the user changes the
 * start/end time in the form, so we don't fire a request per keystroke. */
const HOLD_DEBOUNCE_MS = 500;

type RoomsWithBookings = Awaited<ReturnType<typeof getAllRoomsBookingsForDate>>;
type Booking = TimelineBooking;

function toTimeLabel(totalMinutes: number) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function timeLabelFromDate(d: Date) {
  return d.toTimeString().slice(0, 5);
}

export function ScheduleBoard({
  roomsWithBookings,
  scheduleLayout,
  settings,
  currentUserId,
  date,
  dayStartHour,
  dayEndHour,
  holds,
}: {
  roomsWithBookings: RoomsWithBookings;
  scheduleLayout: ScheduleLayout;
  settings: BookingSettings;
  currentUserId: string;
  date: string;
  dayStartHour: number;
  dayEndHour: number;
  holds: ActiveHold[];
}) {
  const [mode, setMode] = useState<ScheduleFormMode>("create");
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [editingBookingId, setEditingBookingId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [holdError, setHoldError] = useState<string | undefined>();

  // Always-fresh snapshot of the fields the hold heartbeat needs, so the
  // interval below (set up once per modal-open) doesn't read stale state.
  const holdParamsRef = useRef({ date, startTime, endTime });
  holdParamsRef.current = { date, startTime, endTime };

  function resetForm() {
    if (mode === "create" && selectedRoomId) {
      void releaseMyHold();
    }
    setMode("create");
    setSelectedRoomId(undefined);
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime("");
    setEndTime("");
    setHoldError(undefined);
  }

  function handleFreeClick(roomId: string, start: Date) {
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const alignedStart = Math.floor(startMinutes / settings.stepMinutes) * settings.stepMinutes;
    setMode("create");
    setSelectedRoomId(roomId);
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime(toTimeLabel(alignedStart));
    setEndTime(toTimeLabel(alignedStart + settings.minMinutes));
    setHoldError(undefined);
  }

  function handleOwnBookingClick(roomId: string, booking: Booking) {
    setMode("edit");
    setSelectedRoomId(roomId);
    setEditingBookingId(booking.id);
    setTitle(booking.title);
    setStartTime(timeLabelFromDate(booking.startTime));
    setEndTime(timeLabelFromDate(booking.endTime));
    setHoldError(undefined);
  }

  // Request (and keep renewing) a hold on the slot while the modal is open
  // for creating a NEW booking on a free slot. Editing an existing own
  // booking doesn't need a hold — nobody else can be racing to fill a slot
  // that's already booked by the current user.
  useEffect(() => {
    if (mode !== "create" || !selectedRoomId) return;
    const roomId = selectedRoomId;

    async function renew() {
      const { date: d, startTime: s, endTime: e } = holdParamsRef.current;
      if (!s || !e) return;
      const result = await requestHold(roomId, d, s, e);
      setHoldError(result?.error);
    }

    renew();
    const interval = setInterval(renew, HOLD_HEARTBEAT_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedRoomId]);

  // Also re-request right away (debounced) whenever the user changes the
  // start/end time, so other clients see the updated range without waiting
  // for the next heartbeat tick.
  useEffect(() => {
    if (mode !== "create" || !selectedRoomId || !startTime || !endTime) return;
    const roomId = selectedRoomId;
    const timeout = setTimeout(async () => {
      const result = await requestHold(roomId, date, startTime, endTime);
      setHoldError(result?.error);
    }, HOLD_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime]);

  // Safety net: release any hold held by this tab if it unmounts outright
  // (navigation away, tab close) without going through resetForm.
  useEffect(() => {
    return () => {
      void releaseMyHold();
    };
  }, []);

  const selectedRoom = roomsWithBookings.find((r) => r.room.id === selectedRoomId)?.room;
  const editingBooking = editingBookingId
    ? roomsWithBookings
        .flatMap((r) => r.bookings)
        .find((b) => b.id === editingBookingId)
    : undefined;

  // Close the modal on Escape while it's open.
  useEffect(() => {
    if (!selectedRoom) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") resetForm();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  const hours = Array.from(
    { length: dayEndHour - dayStartHour + 1 },
    (_, i) => dayStartHour + i
  );

  return (
    <div>
      <div className="mt-8">
        {scheduleLayout === "vertical" ? (
          <ScheduleVertical
            roomsWithBookings={roomsWithBookings}
            currentUserId={currentUserId}
            dateStr={date}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
            stepMinutes={settings.stepMinutes}
            settings={settings}
            holds={holds}
            onFreeClick={handleFreeClick}
            onOwnBookingClick={handleOwnBookingClick}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-48 shrink-0" />
              <div className="relative h-5 flex-1">
                {hours.map((hour) => {
                  const left = ((hour - dayStartHour) / (dayEndHour - dayStartHour)) * 100;
                  return (
                    <span
                      key={hour}
                      style={{ left: `${left}%` }}
                      className="absolute -translate-x-1/2 text-xs text-gray-500"
                    >
                      {String(hour).padStart(2, "0")}
                    </span>
                  );
                })}
              </div>
            </div>

            {roomsWithBookings.map(({ room, bookings }) => (
              <div
                key={room.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <Link
                  href={`/rooms/${room.id}?date=${date}`}
                  className="w-48 shrink-0 hover:underline"
                >
                  <p className="text-sm font-medium text-gray-900">{room.name}</p>
                  <p className="text-xs text-gray-500">
                    {room.building} · {room.campus}
                  </p>
                </Link>
                <div className="flex-1">
                  <RoomTimeline
                    bookings={bookings}
                    holds={holds.filter((h) => h.roomId === room.id)}
                    currentUserId={currentUserId}
                    dateStr={date}
                    dayStartHour={dayStartHour}
                    dayEndHour={dayEndHour}
                    stepMinutes={settings.stepMinutes}
                    settings={settings}
                    onFreeClick={(start) => handleFreeClick(room.id, start)}
                    onOwnBookingClick={(booking) => handleOwnBookingClick(room.id, booking)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={resetForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={resetForm}
              aria-label="Stäng"
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
            <ScheduleBookingPanel
              date={date}
              settings={settings}
              dayStartHour={dayStartHour}
              dayEndHour={dayEndHour}
              mode={mode}
              selectedRoom={selectedRoom}
              editingBookingId={editingBookingId}
              editingBookingConfirmedAt={editingBooking?.confirmedAt ?? null}
              title={title}
              startTime={startTime}
              endTime={endTime}
              holdError={mode === "create" ? holdError : undefined}
              onTitleChange={setTitle}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onCancelEdit={resetForm}
              onUpdateSuccess={resetForm}
              onCreateSuccess={resetForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}

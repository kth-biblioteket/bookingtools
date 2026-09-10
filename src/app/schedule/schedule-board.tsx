"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoomTimeline, type TimelineBooking } from "@/components/room-timeline";
import { ScheduleVertical } from "@/components/schedule-vertical";
import { ScheduleBookingPanel, type ScheduleFormMode } from "./schedule-booking-panel";
import type { getAllRoomsBookingsForDate } from "@/lib/booking";
import type { BookingSettings, ScheduleLayout } from "@/lib/settings";

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
}: {
  roomsWithBookings: RoomsWithBookings;
  scheduleLayout: ScheduleLayout;
  settings: BookingSettings;
  currentUserId: string;
  date: string;
  dayStartHour: number;
  dayEndHour: number;
}) {
  const [mode, setMode] = useState<ScheduleFormMode>("create");
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [editingBookingId, setEditingBookingId] = useState<string | undefined>();
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function resetForm() {
    setMode("create");
    setSelectedRoomId(undefined);
    setEditingBookingId(undefined);
    setTitle("");
    setStartTime("");
    setEndTime("");
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
  }

  function handleOwnBookingClick(roomId: string, booking: Booking) {
    setMode("edit");
    setSelectedRoomId(roomId);
    setEditingBookingId(booking.id);
    setTitle(booking.title);
    setStartTime(timeLabelFromDate(booking.startTime));
    setEndTime(timeLabelFromDate(booking.endTime));
  }

  const selectedRoom = roomsWithBookings.find((r) => r.room.id === selectedRoomId)?.room;

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
                    currentUserId={currentUserId}
                    dateStr={date}
                    dayStartHour={dayStartHour}
                    dayEndHour={dayEndHour}
                    stepMinutes={settings.stepMinutes}
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
              title={title}
              startTime={startTime}
              endTime={endTime}
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

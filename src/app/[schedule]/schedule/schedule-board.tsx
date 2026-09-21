"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { RoomTimeline, type TimelineBooking } from "@/components/room-timeline";
import { ScheduleVertical } from "@/components/schedule-vertical";
import { UsersIcon, ScreenIcon } from "@/components/room-icons";
import { ScheduleCornerCell } from "@/components/schedule-corner-cell";
import { ScheduleLegend } from "@/components/schedule-legend";
import { ScheduleBookingPanel, type ScheduleFormMode } from "./schedule-booking-panel";
import { requestHold, releaseMyHold } from "@/app/[schedule]/rooms/[id]/actions";
import type { getAllRoomsBookingsForDate } from "@/lib/booking";
import type { ActiveHold } from "@/lib/booking-hold";
import type { BookingSettings, ScheduleLayout } from "@/lib/settings";
import { useI18n } from "@/components/i18n-provider";

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
  scheduleSlug,
  roomsWithBookings,
  scheduleLayout,
  settings,
  currentUserId,
  isAdmin,
  date,
  dayStartHour,
  dayEndHour,
  holds,
}: {
  scheduleSlug: string;
  roomsWithBookings: RoomsWithBookings;
  scheduleLayout: ScheduleLayout;
  settings: BookingSettings;
  /** Null for an anonymous (logged-out) visitor — browsing is public, booking isn't. */
  currentUserId: string | null;
  /** Admins see every booking's real title, not just its status. */
  isAdmin: boolean;
  date: string;
  dayStartHour: number;
  dayEndHour: number;
  holds: ActiveHold[];
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
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
    if (!currentUserId) {
      setLoginPromptOpen(true);
      return;
    }
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
      const result = await requestHold(scheduleSlug, roomId, d, s, e);
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
      const result = await requestHold(scheduleSlug, roomId, date, startTime, endTime);
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

  // One label per hour, centered within that hour's segment — matches the
  // vertical layout's per-row hour labels.
  const hourCount = dayEndHour - dayStartHour;
  const hours = Array.from({ length: hourCount }, (_, i) => dayStartHour + i);

  return (
    <div>
      <div className="mt-8">
        {scheduleLayout === "vertical" ? (
          <ScheduleVertical
            roomsWithBookings={roomsWithBookings}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
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
          // A real grid, matching the vertical layout: shared gridlines and
          // one row per room, rather than each room being its own bordered
          // card. Every hour gets the same 50px floor as the vertical
          // layout's room columns; overflow-x-auto only kicks in once that
          // floor no longer fits.
          <div className="overflow-x-auto pb-3">
            <div
              className="min-w-max"
              style={{ display: "grid", gridTemplateColumns: `5rem repeat(${hourCount}, minmax(50px, 1fr))` }}
            >
              <ScheduleCornerCell
                roomsAt="bottom-left"
                roomsLabel={t("schedule.cornerRoom")}
                timeLabel={t("schedule.cornerTime")}
                className="sticky left-0 z-20 h-10 overflow-hidden"
              />
              {hours.map((hour, i) => (
                <div
                  key={hour}
                  className={`flex h-10 items-center justify-center bg-kth-blue text-sm font-medium text-white ${
                    i > 0 ? "border-l border-white/10" : ""
                  }`}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}

              {roomsWithBookings.map(({ room, bookings }, rowIndex) => (
                <Fragment key={room.id}>
                  <Link
                    href={`/${scheduleSlug}/rooms/${room.id}?date=${date}`}
                    style={{ gridRow: rowIndex + 2 }}
                    className="sticky left-0 z-10 flex items-center justify-start gap-1 border-t border-black/10 bg-kth-sky py-1 pl-3 pr-1 hover:bg-kth-blue"
                  >
                    <span className="truncate text-sm font-semibold text-white">{room.name}</span>
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-medium text-black"
                      title={t("rooms.capacity", { n: room.capacity })}
                    >
                      <UsersIcon />
                      {room.capacity}
                    </span>
                    {room.hasScreen && (
                      <span title={t("rooms.screen")}>
                        <ScreenIcon />
                      </span>
                    )}
                  </Link>
                  <div style={{ gridRow: rowIndex + 2, gridColumn: `2 / -1` }}>
                    <RoomTimeline
                      bookings={bookings}
                      holds={holds.filter((h) => h.roomId === room.id)}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      dateStr={date}
                      dayStartHour={dayStartHour}
                      dayEndHour={dayEndHour}
                      stepMinutes={settings.stepMinutes}
                      settings={settings}
                      onFreeClick={(start) => handleFreeClick(room.id, start)}
                      onOwnBookingClick={(booking) => handleOwnBookingClick(room.id, booking)}
                    />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScheduleLegend requirePreliminaryConfirmation={settings.requirePreliminaryConfirmation} />

      {loginPromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLoginPromptOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLoginPromptOpen(false)}
              aria-label={t("roomDetail.close")}
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
            <p className="mb-4 text-sm text-gray-700">{t("bookingActions.loginToBookPrompt")}</p>
            <Link
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="inline-block rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      )}

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
              aria-label={t("roomDetail.close")}
              className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
            <ScheduleBookingPanel
              scheduleSlug={scheduleSlug}
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

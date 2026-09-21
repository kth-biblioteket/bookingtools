"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  hasOverlap,
  releaseExpiredPreliminaryBookings,
  withSerializableRetry,
  BookingOverlapError,
} from "@/lib/booking";
import { getBookingSettings } from "@/lib/settings";
import { getScheduleBySlug } from "@/lib/schedules";
import { createOrRenewHold, releaseHold } from "@/lib/booking-hold";
import { getT } from "@/lib/i18n/get-dictionary";

export type BookState = { error?: string; success?: string } | undefined;

export async function createBooking(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("bookingActions.loginRequiredBook") };

  const bookSchema = z.object({
    scheduleSlug: z.string().min(1),
    roomId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    title: z.string().trim().min(1, t("bookingActions.titleRequired")).max(100),
  });

  const parsed = bookSchema.safeParse({
    scheduleSlug: formData.get("scheduleSlug"),
    roomId: formData.get("roomId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const { scheduleSlug, roomId, date, startTime, endTime, title } = parsed.data;

  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) return { error: t("common.invalidData") };

  const room = await db.room.findFirst({ where: { id: roomId, scheduleId: schedule.id } });
  if (!room) return { error: t("bookingActions.roomGone") };

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (end <= start) {
    return { error: t("bookingActions.endBeforeStart") };
  }
  if (start < new Date()) {
    return { error: t("bookingActions.pastStartCreate") };
  }

  const { stepMinutes, minMinutes, maxMinutes, requirePreliminaryConfirmation } =
    await getBookingSettings(schedule.id);

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (
    durationMinutes < minMinutes ||
    durationMinutes > maxMinutes ||
    durationMinutes % stepMinutes !== 0
  ) {
    return {
      error: t("bookingActions.durationRule", { min: minMinutes, max: maxMinutes, step: stepMinutes }),
    };
  }

  const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
  if (startMinutesOfDay % stepMinutes !== 0) {
    return { error: t("bookingActions.invalidStartTime") };
  }

  await releaseExpiredPreliminaryBookings(schedule.id);

  try {
    await withSerializableRetry(() =>
      db.$transaction(
        async (tx) => {
          if (await hasOverlap(tx, roomId, start, end)) {
            throw new BookingOverlapError();
          }
          await tx.booking.create({
            data: {
              scheduleId: schedule.id,
              roomId,
              userId: user.id,
              title,
              startTime: start,
              endTime: end,
              confirmedAt: requirePreliminaryConfirmation ? null : new Date(),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    );
  } catch (error) {
    if (error instanceof BookingOverlapError) {
      return { error: t("bookingActions.overlap") };
    }
    throw error;
  }
  await releaseHold(user.id);

  revalidatePath(`/${scheduleSlug}/rooms/${roomId}`);
  revalidatePath(`/${scheduleSlug}/rooms`);
  revalidatePath(`/${scheduleSlug}/bookings`);
  revalidatePath(`/${scheduleSlug}/schedule`);
  return { success: t("bookingActions.createSuccess") };
}

export async function updateBooking(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("bookingActions.loginRequiredEdit") };

  const updateBookSchema = z.object({
    scheduleSlug: z.string().min(1),
    bookingId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    title: z.string().trim().min(1, t("bookingActions.titleRequired")).max(100),
  });

  const parsed = updateBookSchema.safeParse({
    scheduleSlug: formData.get("scheduleSlug"),
    bookingId: formData.get("bookingId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const { scheduleSlug, bookingId, date, startTime, endTime, title } = parsed.data;

  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) return { error: t("common.invalidData") };

  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: user.id, scheduleId: schedule.id },
  });
  if (!booking) return { error: t("bookingActions.bookingNotFoundOrNotYours") };

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (end <= start) {
    return { error: t("bookingActions.endBeforeStart") };
  }
  if (start < new Date()) {
    return { error: t("bookingActions.pastStartEdit") };
  }

  const { stepMinutes, minMinutes, maxMinutes } = await getBookingSettings(schedule.id);

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (
    durationMinutes < minMinutes ||
    durationMinutes > maxMinutes ||
    durationMinutes % stepMinutes !== 0
  ) {
    return {
      error: t("bookingActions.durationRule", { min: minMinutes, max: maxMinutes, step: stepMinutes }),
    };
  }

  const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
  if (startMinutesOfDay % stepMinutes !== 0) {
    return { error: t("bookingActions.invalidStartTime") };
  }

  try {
    await withSerializableRetry(() =>
      db.$transaction(
        async (tx) => {
          if (await hasOverlap(tx, booking.roomId, start, end, bookingId)) {
            throw new BookingOverlapError();
          }
          await tx.booking.update({
            where: { id: bookingId },
            data: { title, startTime: start, endTime: end },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    );
  } catch (error) {
    if (error instanceof BookingOverlapError) {
      return { error: t("bookingActions.overlap") };
    }
    throw error;
  }
  await releaseHold(user.id);

  revalidatePath(`/${scheduleSlug}/rooms/${booking.roomId}`);
  revalidatePath(`/${scheduleSlug}/rooms`);
  revalidatePath(`/${scheduleSlug}/bookings`);
  revalidatePath(`/${scheduleSlug}/schedule`);
  return { success: t("bookingActions.updateSuccess") };
}

const holdSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type HoldState = { error?: string } | undefined;

/**
 * Called when the booking modal opens for a free slot, and again on a
 * heartbeat while it stays open, so other clients see "someone is
 * booking..." instead of letting two people fill in the same slot at once.
 * Purely advisory — see src/lib/booking-hold.ts for why this can't be the
 * only thing preventing a double booking.
 */
export async function requestHold(
  scheduleSlug: string,
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<HoldState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("bookingActions.holdLoginRequired") };

  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) return { error: t("common.invalidData") };

  const parsed = holdSchema.safeParse({ roomId, date, startTime, endTime });
  if (!parsed.success) return { error: t("common.invalidData") };

  const start = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const end = new Date(`${parsed.data.date}T${parsed.data.endTime}:00`);

  const result = await createOrRenewHold(schedule.id, user.id, roomId, start, end);
  if ("error" in result) {
    return {
      error: t(
        result.error === "room_booked" ? "bookingActions.holdRoomBooked" : "bookingActions.holdSlotTaken"
      ),
    };
  }
  return undefined;
}

/** Called when the booking modal closes without submitting (cancel, backdrop click, Escape). */
export async function releaseMyHold(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await releaseHold(user.id);
}

export async function confirmBooking(scheduleSlug: string, bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: user.id },
  });
  if (!booking || booking.confirmedAt) return;

  await db.booking.update({
    where: { id: bookingId },
    data: { confirmedAt: new Date() },
  });

  revalidatePath(`/${scheduleSlug}/rooms/${booking.roomId}`);
  revalidatePath(`/${scheduleSlug}/rooms`);
  revalidatePath(`/${scheduleSlug}/bookings`);
  revalidatePath(`/${scheduleSlug}/schedule`);
}

export async function cancelBooking(scheduleSlug: string, bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: user.id },
  });
  if (!booking) return;

  await db.booking.delete({ where: { id: booking.id } });

  revalidatePath(`/${scheduleSlug}/rooms/${booking.roomId}`);
  revalidatePath(`/${scheduleSlug}/rooms`);
  revalidatePath(`/${scheduleSlug}/bookings`);
  revalidatePath(`/${scheduleSlug}/schedule`);
}

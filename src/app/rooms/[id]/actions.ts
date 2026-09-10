"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasOverlap } from "@/lib/booking";
import { getBookingSettings } from "@/lib/settings";
import { createOrRenewHold, releaseHold } from "@/lib/booking-hold";

const bookSchema = z.object({
  roomId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().trim().min(1, "Ange ett ärende för bokningen").max(100),
});

export type BookState = { error?: string; success?: string } | undefined;

export async function createBooking(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du måste vara inloggad för att boka" };

  const parsed = bookSchema.safeParse({
    roomId: formData.get("roomId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }

  const { roomId, date, startTime, endTime, title } = parsed.data;

  const room = await db.room.findUnique({ where: { id: roomId } });
  if (!room) return { error: "Rummet finns inte längre" };

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (end <= start) {
    return { error: "Sluttiden måste vara efter starttiden" };
  }
  if (start < new Date()) {
    return { error: "Du kan inte boka en tid som redan passerat" };
  }

  const { stepMinutes, minMinutes, maxMinutes, requirePreliminaryConfirmation } =
    await getBookingSettings();

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (
    durationMinutes < minMinutes ||
    durationMinutes > maxMinutes ||
    durationMinutes % stepMinutes !== 0
  ) {
    return {
      error: `Bokningen måste vara mellan ${minMinutes} och ${maxMinutes} minuter, i steg om ${stepMinutes} minuter.`,
    };
  }

  const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
  if (startMinutesOfDay % stepMinutes !== 0) {
    return { error: "Starttiden måste vara på ett tillåtet klockslag." };
  }

  const overlap = await hasOverlap(roomId, start, end);
  if (overlap) {
    return { error: "Rummet är redan bokat under en del av den valda tiden" };
  }

  await db.booking.create({
    data: {
      roomId,
      userId: user.id,
      title,
      startTime: start,
      endTime: end,
      confirmedAt: requirePreliminaryConfirmation ? null : new Date(),
    },
  });
  await releaseHold(user.id);

  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/rooms");
  revalidatePath("/bookings");
  revalidatePath("/schedule");
  return { success: "Bokningen är klar!" };
}

const updateBookSchema = z.object({
  bookingId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().trim().min(1, "Ange ett ärende för bokningen").max(100),
});

export async function updateBooking(
  _prevState: BookState,
  formData: FormData
): Promise<BookState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du måste vara inloggad för att ändra en bokning" };

  const parsed = updateBookSchema.safeParse({
    bookingId: formData.get("bookingId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }

  const { bookingId, date, startTime, endTime, title } = parsed.data;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: user.id },
  });
  if (!booking) return { error: "Bokningen finns inte eller tillhör dig inte" };

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (end <= start) {
    return { error: "Sluttiden måste vara efter starttiden" };
  }
  if (start < new Date()) {
    return { error: "Du kan inte ändra till en tid som redan passerat" };
  }

  const { stepMinutes, minMinutes, maxMinutes } = await getBookingSettings();

  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  if (
    durationMinutes < minMinutes ||
    durationMinutes > maxMinutes ||
    durationMinutes % stepMinutes !== 0
  ) {
    return {
      error: `Bokningen måste vara mellan ${minMinutes} och ${maxMinutes} minuter, i steg om ${stepMinutes} minuter.`,
    };
  }

  const startMinutesOfDay = start.getHours() * 60 + start.getMinutes();
  if (startMinutesOfDay % stepMinutes !== 0) {
    return { error: "Starttiden måste vara på ett tillåtet klockslag." };
  }

  const overlap = await hasOverlap(booking.roomId, start, end, bookingId);
  if (overlap) {
    return { error: "Rummet är redan bokat under en del av den valda tiden" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { title, startTime: start, endTime: end },
  });
  await releaseHold(user.id);

  revalidatePath(`/rooms/${booking.roomId}`);
  revalidatePath("/rooms");
  revalidatePath("/bookings");
  revalidatePath("/schedule");
  return { success: "Bokningen är uppdaterad!" };
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
 * heartbeat while it stays open, so other clients see "någon bokar..."
 * instead of letting two people fill in the same slot at once. Purely
 * advisory — see src/lib/booking-hold.ts for why this can't be the only
 * thing preventing a double booking.
 */
export async function requestHold(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<HoldState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Du måste vara inloggad" };

  const parsed = holdSchema.safeParse({ roomId, date, startTime, endTime });
  if (!parsed.success) return { error: "Ogiltiga uppgifter" };

  const start = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const end = new Date(`${parsed.data.date}T${parsed.data.endTime}:00`);

  const result = await createOrRenewHold(user.id, roomId, start, end);
  if ("error" in result) return { error: result.error };
  return undefined;
}

/** Called when the booking modal closes without submitting (cancel, backdrop click, Escape). */
export async function releaseMyHold(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await releaseHold(user.id);
}

export async function confirmBooking(bookingId: string) {
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

  revalidatePath(`/rooms/${booking.roomId}`);
  revalidatePath("/rooms");
  revalidatePath("/bookings");
  revalidatePath("/schedule");
}

export async function cancelBooking(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const booking = await db.booking.findFirst({
    where: { id: bookingId, userId: user.id },
  });
  if (!booking) return;

  await db.booking.delete({ where: { id: booking.id } });

  revalidatePath(`/rooms/${booking.roomId}`);
  revalidatePath("/rooms");
  revalidatePath("/bookings");
  revalidatePath("/schedule");
}

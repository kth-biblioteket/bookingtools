"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyBookingsChanged } from "@/lib/booking-events";

const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(100, "Namn får vara högst 100 tecken"),
  building: z.string().trim().min(1, "Byggnad krävs").max(100, "Byggnad får vara högst 100 tecken"),
  campus: z.string().trim().min(1, "Campus krävs").max(100, "Campus får vara högst 100 tecken"),
  capacity: z.coerce.number().int().positive("Kapacitet måste vara ett positivt heltal"),
  floor: z.string().trim().max(100, "Våning får vara högst 100 tecken").optional(),
});

export type CreateRoomState = { error?: string; success?: string } | undefined;

export async function createRoom(
  prevState: CreateRoomState,
  formData: FormData
): Promise<CreateRoomState> {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: "Du har inte behörighet att göra detta" };
  }

  const parsed = createRoomSchema.safeParse({
    name: formData.get("name"),
    building: formData.get("building"),
    campus: formData.get("campus"),
    capacity: formData.get("capacity"),
    floor: formData.get("floor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }

  const hasScreen = formData.get("hasScreen") === "on";
  const hasWhiteboard = formData.get("hasWhiteboard") === "on";

  const { name, building, campus, capacity, floor } = parsed.data;

  await db.room.create({
    data: {
      name,
      building,
      campus,
      capacity,
      floor: floor || null,
      hasScreen,
      hasWhiteboard,
    },
  });

  revalidatePath("/admin/rooms");
  notifyBookingsChanged();
  return { success: "Rummet är tillagt!" };
}

const updateRoomSchema = createRoomSchema;

export type UpdateRoomState = { error?: string; success?: string } | undefined;

export async function updateRoom(
  prevState: UpdateRoomState,
  formData: FormData
): Promise<UpdateRoomState> {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: "Du har inte behörighet att göra detta" };
  }

  const roomId = formData.get("roomId");
  if (typeof roomId !== "string" || !roomId) {
    return { error: "Ogiltigt rum" };
  }

  const parsed = updateRoomSchema.safeParse({
    name: formData.get("name"),
    building: formData.get("building"),
    campus: formData.get("campus"),
    capacity: formData.get("capacity"),
    floor: formData.get("floor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }

  const existingRoom = await db.room.findUnique({ where: { id: roomId } });
  if (!existingRoom) {
    return { error: "Rummet finns inte längre" };
  }

  const hasScreen = formData.get("hasScreen") === "on";
  const hasWhiteboard = formData.get("hasWhiteboard") === "on";

  const { name, building, campus, capacity, floor } = parsed.data;

  await db.room.update({
    where: { id: roomId },
    data: {
      name,
      building,
      campus,
      capacity,
      floor: floor || null,
      hasScreen,
      hasWhiteboard,
    },
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${roomId}/edit`);
  notifyBookingsChanged();
  return { success: "Ändringarna är sparade!" };
}

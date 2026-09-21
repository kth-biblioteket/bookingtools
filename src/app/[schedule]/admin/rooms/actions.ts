"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getScheduleBySlug } from "@/lib/schedules";
import { notifyBookingsChanged } from "@/lib/booking-events";
import { getT } from "@/lib/i18n/get-dictionary";
import type { T } from "@/lib/i18n/translate";

function roomSchema(t: T) {
  return z.object({
    name: z.string().trim().min(1, t("adminRooms.errors.nameRequired")).max(100, t("adminRooms.errors.nameTooLong")),
    roomNumber: z.coerce.number().int(t("adminRooms.errors.roomNumberInt")),
    building: z
      .string()
      .trim()
      .min(1, t("adminRooms.errors.buildingRequired"))
      .max(100, t("adminRooms.errors.buildingTooLong")),
    campus: z
      .string()
      .trim()
      .min(1, t("adminRooms.errors.campusRequired"))
      .max(100, t("adminRooms.errors.campusTooLong")),
    capacity: z.coerce.number().int().positive(t("adminRooms.errors.capacityPositive")),
    floor: z.string().trim().max(100, t("adminRooms.errors.floorTooLong")).optional(),
  });
}

export type CreateRoomState = { error?: string; success?: string } | undefined;

export async function createRoom(
  prevState: CreateRoomState,
  formData: FormData
): Promise<CreateRoomState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const scheduleSlug = formData.get("scheduleSlug");
  if (typeof scheduleSlug !== "string" || !scheduleSlug) {
    return { error: t("common.invalidData") };
  }
  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) {
    return { error: t("common.invalidData") };
  }

  const parsed = roomSchema(t).safeParse({
    name: formData.get("name"),
    roomNumber: formData.get("roomNumber"),
    building: formData.get("building"),
    campus: formData.get("campus"),
    capacity: formData.get("capacity"),
    floor: formData.get("floor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const hasScreen = formData.get("hasScreen") === "on";
  const hasWhiteboard = formData.get("hasWhiteboard") === "on";

  const { name, roomNumber, building, campus, capacity, floor } = parsed.data;

  await db.room.create({
    data: {
      scheduleId: schedule.id,
      name,
      roomNumber,
      building,
      campus,
      capacity,
      floor: floor || null,
      hasScreen,
      hasWhiteboard,
    },
  });

  revalidatePath(`/${scheduleSlug}/admin/rooms`);
  notifyBookingsChanged();
  return { success: t("adminRooms.errors.created") };
}

export type UpdateRoomState = { error?: string; success?: string } | undefined;

export async function updateRoom(
  prevState: UpdateRoomState,
  formData: FormData
): Promise<UpdateRoomState> {
  const { t } = await getT();
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { error: t("common.noPermission") };
  }

  const scheduleSlug = formData.get("scheduleSlug");
  if (typeof scheduleSlug !== "string" || !scheduleSlug) {
    return { error: t("common.invalidData") };
  }
  const schedule = await getScheduleBySlug(scheduleSlug);
  if (!schedule || !schedule.isActive) {
    return { error: t("common.invalidData") };
  }

  const roomId = formData.get("roomId");
  if (typeof roomId !== "string" || !roomId) {
    return { error: t("adminRooms.errors.invalidRoom") };
  }

  const parsed = roomSchema(t).safeParse({
    name: formData.get("name"),
    roomNumber: formData.get("roomNumber"),
    building: formData.get("building"),
    campus: formData.get("campus"),
    capacity: formData.get("capacity"),
    floor: formData.get("floor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("common.invalidData") };
  }

  const existingRoom = await db.room.findFirst({ where: { id: roomId, scheduleId: schedule.id } });
  if (!existingRoom) {
    return { error: t("adminRooms.errors.roomGone") };
  }

  const hasScreen = formData.get("hasScreen") === "on";
  const hasWhiteboard = formData.get("hasWhiteboard") === "on";

  const { name, roomNumber, building, campus, capacity, floor } = parsed.data;

  await db.room.update({
    where: { id: roomId },
    data: {
      name,
      roomNumber,
      building,
      campus,
      capacity,
      floor: floor || null,
      hasScreen,
      hasWhiteboard,
    },
  });

  revalidatePath(`/${scheduleSlug}/admin/rooms`);
  revalidatePath(`/${scheduleSlug}/admin/rooms/${roomId}/edit`);
  notifyBookingsChanged();
  return { success: t("adminRooms.errors.updated") };
}

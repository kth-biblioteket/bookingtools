"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyBookingsChanged } from "@/lib/booking-events";

export async function deleteRoom(roomId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!isAdmin(user)) return;

  await db.room.delete({ where: { id: roomId } });

  revalidatePath("/admin/rooms");
  notifyBookingsChanged();
}

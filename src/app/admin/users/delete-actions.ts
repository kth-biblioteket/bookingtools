"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyBookingsChanged } from "@/lib/booking-events";

export async function deleteUser(userId: string): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;
  if (!isAdmin(currentUser)) return;
  // Deleting your own account here would lock you out mid-session with no
  // way back in through the UI — make people do that from elsewhere.
  if (userId === currentUser.id) return;

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  notifyBookingsChanged();
}

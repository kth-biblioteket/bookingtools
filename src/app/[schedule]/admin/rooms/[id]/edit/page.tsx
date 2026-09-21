import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getScheduleBySlug } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";
import { EditRoomForm } from "./edit-room-form";

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ schedule: string; id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");

  const { schedule: slug, id } = await params;
  const schedule = await getScheduleBySlug(slug);
  if (!schedule || !schedule.isActive) notFound();

  const room = await db.room.findFirst({ where: { id, scheduleId: schedule.id } });
  if (!room) notFound();
  const { t } = await getT();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href={`/${slug}/admin/rooms`} className="text-sm text-kth-blue hover:underline">
        {t("adminRooms.backToRooms")}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gray-900">
        {t("adminRooms.editHeading", { name: room.name })}
      </h1>

      <div className="mt-6">
        <EditRoomForm scheduleSlug={slug} room={room} />
      </div>
    </div>
  );
}

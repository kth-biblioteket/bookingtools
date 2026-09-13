import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/get-dictionary";
import { NewRoomForm } from "./new-room-form";
import { DeleteRoomButton } from "./delete-room-button";
import { deleteRoom } from "./delete-actions";

export default async function AdminRoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/rooms");

  const rooms = await db.room.findMany({
    orderBy: { roomNumber: "asc" },
    include: {
      _count: {
        select: { bookings: { where: { endTime: { gte: new Date() } } } },
      },
    },
  });
  const { t } = await getT();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href="/admin" className="text-sm text-kth-blue hover:underline">
        {t("adminRooms.backToSettings")}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gray-900">{t("adminRooms.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("adminRooms.subtitle")}</p>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-gray-700">{t("adminRooms.addHeading")}</h2>
        <NewRoomForm />
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-gray-700">{t("adminRooms.existingHeading")}</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-500">
                  {room.building} · {room.campus}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("rooms.capacity", { n: room.capacity })}
                  {room.hasScreen ? ` · ${t("rooms.screen")}` : ""}
                  {room.hasWhiteboard ? ` · ${t("rooms.whiteboard")}` : ""}
                  {" · "}
                  {room._count.bookings > 0
                    ? t("adminRooms.upcomingBookingsCount", { n: room._count.bookings })
                    : t("adminRooms.noUpcomingBookings")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/rooms/${room.id}/edit`}
                  className="text-sm font-medium text-kth-blue hover:underline"
                >
                  {t("adminRooms.edit")}
                </Link>
                <DeleteRoomButton roomId={room.id} action={deleteRoom} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

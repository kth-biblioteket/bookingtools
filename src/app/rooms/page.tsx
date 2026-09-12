import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoomsWithTodayStatus } from "@/lib/booking";
import { AutoRefresh } from "@/components/auto-refresh";
import { getT } from "@/lib/i18n/get-dictionary";

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roomsWithStatus = await getRoomsWithTodayStatus();
  const { t } = await getT();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold text-gray-900">{t("rooms.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("rooms.subtitle")}</p>
      <Link
        href="/schedule"
        className="mt-2 inline-block text-sm font-medium text-kth-blue hover:underline"
      >
        {t("rooms.seeAllToday")}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roomsWithStatus.map(({ room, status }) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kth-sky hover:shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-medium text-gray-900">{room.name}</h2>
                <p className="text-sm text-gray-500">
                  {room.building} · {room.campus}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  status.free
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {status.free ? t("rooms.free") : t("rooms.occupied")}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {status.free
                ? status.until
                  ? t("rooms.freeUntil", { time: formatTime(status.until) })
                  : t("rooms.freeAllDay")
                : t("rooms.occupiedUntil", { time: formatTime(status.until!) })}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {t("rooms.capacity", { n: room.capacity })}
              {room.hasScreen ? ` · ${t("rooms.screen")}` : ""}
              {room.hasWhiteboard ? ` · ${t("rooms.whiteboard")}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

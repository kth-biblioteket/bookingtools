import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoomsWithTodayStatus } from "@/lib/booking";
import { AutoRefresh } from "@/components/auto-refresh";

function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roomsWithStatus = await getRoomsWithTodayStatus();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold text-gray-900">Grupprum</h1>
      <p className="mt-1 text-sm text-gray-500">
        Status just nu. Klicka på ett rum för att se schemat och boka en tid.
      </p>
      <Link
        href="/schedule"
        className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        Se schema för alla rum idag →
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roomsWithStatus.map(({ room, status }) => (
          <Link
            key={room.id}
            href={`/rooms/${room.id}`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
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
                {status.free ? "Ledigt" : "Upptaget"}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {status.free
                ? status.until
                  ? `Ledigt till ${formatTime(status.until)}`
                  : "Ledigt hela dagen"
                : `Upptaget till ${formatTime(status.until!)}`}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Plats för {room.capacity} personer
              {room.hasScreen ? " · Skärm" : ""}
              {room.hasWhiteboard ? " · Whiteboard" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

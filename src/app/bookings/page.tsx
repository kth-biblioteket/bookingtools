import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUpcomingBookingsForUser } from "@/lib/booking";
import { CancelButton } from "@/components/cancel-button";
import { cancelBooking } from "@/app/rooms/[id]/actions";

function formatDateTime(date: Date) {
  const d = date.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  const t = date.toTimeString().slice(0, 5);
  return `${d} ${t}`;
}

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bookings = await getUpcomingBookingsForUser(user.id);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Mina bokningar</h1>

      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Du har inga kommande bokningar.{" "}
          <Link href="/rooms" className="font-medium text-blue-700 hover:underline">
            Boka ett rum
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{b.title}</p>
                <p className="text-sm text-gray-500">
                  {b.room.name} · {b.room.building}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(b.startTime)}–{b.endTime.toTimeString().slice(0, 5)}
                </p>
              </div>
              <CancelButton bookingId={b.id} action={cancelBooking} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

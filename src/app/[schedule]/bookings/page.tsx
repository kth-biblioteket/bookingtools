import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUpcomingBookingsForUser } from "@/lib/booking";
import { getScheduleBySlug } from "@/lib/schedules";
import { CancelButton } from "@/components/cancel-button";
import { AutoRefresh } from "@/components/auto-refresh";
import { cancelBooking } from "@/app/[schedule]/rooms/[id]/actions";
import { getT } from "@/lib/i18n/get-dictionary";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ schedule: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { schedule: slug } = await params;
  const schedule = await getScheduleBySlug(slug);
  if (!schedule || !schedule.isActive) notFound();

  const bookings = await getUpcomingBookingsForUser(schedule.id, user.id);
  const { locale, t } = await getT();

  function formatDateTime(date: Date) {
    const d = date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    const time = date.toTimeString().slice(0, 5);
    return `${d} ${time}`;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold text-gray-900">{t("bookings.heading")}</h1>

      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          {t("bookings.none")}{" "}
          <Link href={`/${slug}/rooms`} className="font-medium text-kth-blue hover:underline">
            {t("bookings.bookARoom")}
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
              <CancelButton bookingId={b.id} action={(id) => cancelBooking(slug, id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getSettings, getOpeningHours } from "@/lib/settings";
import { getScheduleBySlug } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";
import { SettingsForm } from "./settings-form";
import { MapForm } from "./map-form";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ schedule: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");

  const { schedule: slug } = await params;
  const schedule = await getScheduleBySlug(slug);
  if (!schedule || !schedule.isActive) notFound();

  const [settings, openingHours, { t }] = await Promise.all([
    getSettings(schedule.id),
    getOpeningHours(schedule.id),
    getT(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t("admin.heading")} — {schedule.name}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{t("admin.subtitle")}</p>

      <SettingsForm scheduleSlug={slug} settings={settings} openingHours={openingHours} />

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("admin.mapHeading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("admin.mapSubtitle")}</p>
        <MapForm scheduleSlug={slug} mapSvg={schedule.mapSvg} />
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("admin.roomsHeading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("admin.roomsSubtitle")}</p>
        <Link
          href={`/${slug}/admin/rooms`}
          className="mt-2 inline-block text-sm font-medium text-kth-blue hover:underline"
        >
          {t("admin.manageRooms")}
        </Link>
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("admin.usersHeading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("admin.usersSubtitle")}</p>
        <Link
          href="/system-admin/users"
          className="mt-2 inline-block text-sm font-medium text-kth-blue hover:underline"
        >
          {t("admin.manageUsers")}
        </Link>
      </div>
    </div>
  );
}

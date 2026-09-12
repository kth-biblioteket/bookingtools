import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getSettings, getOpeningHours } from "@/lib/settings";
import { getT } from "@/lib/i18n/get-dictionary";
import { SettingsForm } from "./settings-form";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/rooms");

  const [settings, openingHours, { t }] = await Promise.all([getSettings(), getOpeningHours(), getT()]);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">{t("admin.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("admin.subtitle")}</p>

      <SettingsForm settings={settings} openingHours={openingHours} />

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("admin.roomsHeading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("admin.roomsSubtitle")}</p>
        <Link
          href="/admin/rooms"
          className="mt-2 inline-block text-sm font-medium text-kth-blue hover:underline"
        >
          {t("admin.manageRooms")}
        </Link>
      </div>
    </div>
  );
}

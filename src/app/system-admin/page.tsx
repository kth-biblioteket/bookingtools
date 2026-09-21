import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getAllSchedules } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";
import { NewScheduleForm } from "./new-schedule-form";
import { ScheduleRow } from "./schedule-row";

// Global admin, not per-schedule — this page manages the list of Schedule
// rows themselves (create/rename/activate/deactivate), guarded by the same
// isAdmin() gate as every /[schedule]/admin/** page. See the plan's "Fas 2"
// section for why per-schedule admin roles are explicitly out of scope this
// round.
export default async function SystemAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");

  const [schedules, { t }] = await Promise.all([getAllSchedules(), getT()]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">{t("systemAdmin.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("systemAdmin.subtitle")}</p>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-medium text-gray-700">{t("systemAdmin.addHeading")}</h2>
        <NewScheduleForm />
      </div>

      <div className="mt-10">
        <h2 className="mb-2 text-sm font-medium text-gray-700">{t("systemAdmin.existingHeading")}</h2>
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <ScheduleRow key={schedule.id} schedule={schedule} />
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("adminUsers.heading")}</h2>
        <p className="mt-1 text-sm text-gray-500">{t("adminUsers.subtitle")}</p>
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

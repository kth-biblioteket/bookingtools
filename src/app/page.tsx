import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getActiveSchedules } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";

// The KTH ADFS login round trip no longer lands here — librarytools-auth
// owns the fixed /mrbs redirect_uri directly now (see the plan, Fas 1) and
// hands the browser straight to src/proxy.ts's session upgrade instead.
//
// This is now the schedule selector (Fas 2): a single active schedule skips
// straight to it, more than one shows a picker, and an admin also gets a
// link to the schedule-list itself.
export default async function Home() {
  const [user, schedules, { t }] = await Promise.all([getCurrentUser(), getActiveSchedules(), getT()]);

  if (schedules.length === 1) {
    redirect(`/${schedules[0].slug}/rooms`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">{t("home.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("home.subtitle")}</p>

      <div className="mt-6 space-y-2">
        {schedules.map((schedule) => (
          <Link
            key={schedule.id}
            href={`/${schedule.slug}/rooms`}
            className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-kth-sky hover:shadow"
          >
            <h2 className="font-medium text-gray-900">{schedule.name}</h2>
            {schedule.description && <p className="mt-1 text-sm text-gray-500">{schedule.description}</p>}
          </Link>
        ))}
        {schedules.length === 0 && <p className="text-sm text-gray-500">{t("home.none")}</p>}
      </div>

      {user && isAdmin(user) && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <Link href="/system-admin" className="text-sm font-medium text-kth-blue hover:underline">
            {t("home.manageSchedules")}
          </Link>
        </div>
      )}
    </div>
  );
}

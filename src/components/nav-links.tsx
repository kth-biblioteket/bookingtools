"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useI18n } from "@/components/i18n-provider";

/** Recognized top-level paths that are NOT `/[schedule]/...` — every other
 * first path segment is treated as the current schedule's slug. Falls back
 * to "grupprum" (the one schedule that exists before any admin creates a
 * second one) when the current page isn't inside a schedule at all, e.g.
 * /login or /system-admin — matching what "/" itself resolves to today. */
const NON_SCHEDULE_ROOTS = new Set(["system-admin", "login", "signup", "rooms", "schedule", "bookings", "admin"]);
const DEFAULT_SCHEDULE_SLUG = "grupprum";

function currentScheduleSlug(pathname: string): string {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (!firstSegment || NON_SCHEDULE_ROOTS.has(firstSegment)) return DEFAULT_SCHEDULE_SLUG;
  return firstSegment;
}

type ScheduleOption = { slug: string; name: string };

/** Only rendered when there's more than one active schedule to choose
 * between — otherwise it'd be a dropdown with a single, pointless option. */
function ScheduleSwitcher({ schedules, currentSlug }: { schedules: ScheduleOption[]; currentSlug: string }) {
  const router = useRouter();
  if (schedules.length < 2) return null;

  return (
    <select
      value={schedules.some((s) => s.slug === currentSlug) ? currentSlug : ""}
      onChange={(e) => router.push(`/${e.target.value}/rooms`)}
      className="rounded-md border border-kth-light-blue bg-kth-navy px-2 py-1 text-sm text-kth-light-blue"
    >
      {!schedules.some((s) => s.slug === currentSlug) && <option value="" disabled />}
      {schedules.map((schedule) => (
        <option key={schedule.slug} value={schedule.slug} className="text-black">
          {schedule.name}
        </option>
      ))}
    </select>
  );
}

export function NavLinks({
  user,
  isAdmin,
  schedules,
}: {
  user: { name: string } | null;
  isAdmin: boolean;
  schedules: ScheduleOption[];
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const slug = currentScheduleSlug(pathname);

  if (!user) {
    return (
      <>
        <ScheduleSwitcher schedules={schedules} currentSlug={slug} />
        <Link href={`/${slug}/rooms`} className="text-kth-light-blue hover:text-white">
          {t("nav.rooms")}
        </Link>
        <Link href={`/${slug}/schedule`} className="text-kth-light-blue hover:text-white">
          {t("nav.schedule")}
        </Link>
        <Link href="/login" className="text-kth-light-blue hover:text-white">
          {t("nav.login")}
        </Link>
        <LanguageSwitcher />
        <Link
          href="/signup"
          className="rounded-md bg-white px-3 py-1.5 text-center font-medium text-kth-blue hover:bg-kth-light-blue"
        >
          {t("nav.signup")}
        </Link>
      </>
    );
  }

  return (
    <>
      <ScheduleSwitcher schedules={schedules} currentSlug={slug} />
      <Link href={`/${slug}/rooms`} className="text-kth-light-blue hover:text-white">
        {t("nav.rooms")}
      </Link>
      <Link href={`/${slug}/schedule`} className="text-kth-light-blue hover:text-white">
        {t("nav.schedule")}
      </Link>
      <Link href={`/${slug}/bookings`} className="text-kth-light-blue hover:text-white">
        {t("nav.myBookings")}
      </Link>
      {isAdmin && (
        <>
          <Link href={`/${slug}/admin`} className="text-kth-light-blue hover:text-white">
            {t("nav.admin")}
          </Link>
          {/* The home page's schedule picker (which links here too) is skipped
           * whenever exactly one schedule is active, so this is the only
           * reachable link to schedule management once that's the case. */}
          <Link href="/system-admin" className="text-kth-light-blue hover:text-white">
            {t("nav.systemAdmin")}
          </Link>
        </>
      )}
      <span className="text-kth-sky">{user.name}</span>
      <LanguageSwitcher />
      <LogoutButton />
    </>
  );
}

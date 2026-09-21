"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function NavLinks({
  user,
  isAdmin,
}: {
  user: { name: string } | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const slug = currentScheduleSlug(pathname);

  if (!user) {
    return (
      <>
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
        <Link href={`/${slug}/admin`} className="text-kth-light-blue hover:text-white">
          {t("nav.admin")}
        </Link>
      )}
      <span className="text-kth-sky">{user.name}</span>
      <LanguageSwitcher />
      <LogoutButton />
    </>
  );
}

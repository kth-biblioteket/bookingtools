"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

/**
 * The date display in the middle of a day-navigation bar: a native date
 * picker for jumping straight to an arbitrary day (it already shows the
 * current date, so no separate text label is needed alongside it), plus a
 * quick "Show today" link back to today when viewing a different day.
 */
export function DateNav({
  date,
  today,
  basePath,
}: {
  date: string;
  today: string;
  basePath: string;
}) {
  const router = useRouter();
  const isToday = date === today;
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3">
      {!isToday && (
        <Link
          href={`${basePath}?date=${today}`}
          className="text-sm font-medium text-kth-blue hover:underline"
        >
          {t("dateNav.showToday")}
        </Link>
      )}
      <input
        type="date"
        value={date}
        onChange={(e) => {
          if (e.target.value) router.push(`${basePath}?date=${e.target.value}`);
        }}
        aria-label={t("dateNav.pickDate")}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
      />
    </div>
  );
}

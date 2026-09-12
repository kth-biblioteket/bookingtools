"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * The date display in the middle of a day-navigation bar: a native date
 * picker for jumping straight to an arbitrary day (it already shows the
 * current date, so no separate text label is needed alongside it), plus a
 * quick "Visa idag" link back to today when viewing a different day.
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

  return (
    <div className="flex items-center gap-3">
      {!isToday && (
        <Link
          href={`${basePath}?date=${today}`}
          className="text-sm font-medium text-kth-blue hover:underline"
        >
          Visa idag
        </Link>
      )}
      <input
        type="date"
        value={date}
        onChange={(e) => {
          if (e.target.value) router.push(`${basePath}?date=${e.target.value}`);
        }}
        aria-label="Välj datum"
        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
      />
    </div>
  );
}

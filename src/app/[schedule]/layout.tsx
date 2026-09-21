import { notFound } from "next/navigation";
import { getScheduleBySlug } from "@/lib/schedules";

/**
 * Resolves the `schedule` route param to a Schedule row, 404ing if it
 * doesn't exist or has been deactivated. Every page/action further down
 * re-resolves the slug itself (see getScheduleBySlug's doc comment) rather
 * than this layout threading the row down via context — this codebase
 * already follows that precedent for per-request data (getCurrentUser() is
 * called repeatedly rather than passed through a shared context), and a
 * single indexed lookup per page is cheap.
 */
export default async function ScheduleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schedule: string }>;
}) {
  const { schedule: slug } = await params;
  const schedule = await getScheduleBySlug(slug);
  if (!schedule || !schedule.isActive) notFound();

  return <>{children}</>;
}

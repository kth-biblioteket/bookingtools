import "server-only";
import { db } from "@/lib/db";

/**
 * Looks up a Schedule by its URL slug. Callers that require an active
 * schedule (i.e. every page under `[schedule]/`) should treat a null result
 * as `notFound()` — see `src/app/[schedule]/layout.tsx`, which is the only
 * place that does that check; every other server component/action in this
 * app re-fetches by slug again here (same precedent as calling
 * `getCurrentUser()` repeatedly rather than threading it through context —
 * cheap, single indexed query, no risk of a stale value from a shared
 * context).
 */
export async function getScheduleBySlug(slug: string) {
  return db.schedule.findUnique({ where: { slug } });
}

/** Only schedules visitors/booking pages should ever be able to reach. */
export async function getActiveSchedules() {
  return db.schedule.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
}

/** Every schedule, active or not — for the system-admin schedule list. */
export async function getAllSchedules() {
  return db.schedule.findMany({ orderBy: { createdAt: "asc" } });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createSchedule(data: { slug: string; name: string; description?: string | null }) {
  const slug = slugify(data.slug);
  return db.schedule.create({
    data: { slug, name: data.name, description: data.description || null },
  });
}

export async function renameSchedule(
  id: string,
  data: { name: string; description?: string | null }
) {
  return db.schedule.update({
    where: { id },
    data: { name: data.name, description: data.description || null },
  });
}

export async function setScheduleActive(id: string, isActive: boolean) {
  return db.schedule.update({ where: { id }, data: { isActive } });
}

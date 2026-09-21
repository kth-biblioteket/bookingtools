import { redirect } from "next/navigation";

// Legacy bookmark shim — see src/app/rooms/page.tsx.
export default async function LegacyScheduleRedirect({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  redirect(`/grupprum/schedule${date ? `?date=${date}` : ""}`);
}

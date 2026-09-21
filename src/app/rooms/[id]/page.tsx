import { redirect } from "next/navigation";

// Legacy bookmark shim — see src/app/rooms/page.tsx.
export default async function LegacyRoomRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  redirect(`/grupprum/rooms/${id}${date ? `?date=${date}` : ""}`);
}

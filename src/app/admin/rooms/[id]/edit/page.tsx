import { redirect } from "next/navigation";

// Legacy bookmark shim — see src/app/admin/page.tsx.
export default async function LegacyAdminRoomEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/grupprum/admin/rooms/${id}/edit`);
}

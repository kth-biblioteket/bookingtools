import { redirect } from "next/navigation";

// Legacy bookmark shim — see src/app/admin/page.tsx.
export default function LegacyAdminRoomsRedirect() {
  redirect("/grupprum/admin/rooms");
}

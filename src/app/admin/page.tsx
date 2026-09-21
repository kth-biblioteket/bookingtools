import { redirect } from "next/navigation";

// Legacy bookmark shim: /admin used to be this app's only settings/rooms
// page; it's now the per-schedule admin page at /[schedule]/admin (global
// user management moved to /system-admin/users) — see src/app/rooms/page.tsx.
export default function LegacyAdminRedirect() {
  redirect("/grupprum/admin");
}

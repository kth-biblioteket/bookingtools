import { redirect } from "next/navigation";

// Legacy bookmark shim: global user management moved to /system-admin/users
// — see src/app/admin/page.tsx.
export default function LegacyAdminUsersRedirect() {
  redirect("/system-admin/users");
}

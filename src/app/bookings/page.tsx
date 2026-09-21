import { redirect } from "next/navigation";

// Legacy bookmark shim — see src/app/rooms/page.tsx.
export default function LegacyBookingsRedirect() {
  redirect("/grupprum/bookings");
}

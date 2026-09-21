import { redirect } from "next/navigation";

// Legacy bookmark shim: this app used to have exactly one (unnamed,
// un-scoped) schedule. Fas 2 turned that into the "grupprum" Schedule,
// addressed at /grupprum/rooms — see the plan's multi-schedule section.
export default function LegacyRoomsRedirect() {
  redirect("/grupprum/rooms");
}

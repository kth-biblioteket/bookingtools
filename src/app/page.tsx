import { redirect } from "next/navigation";

// The KTH ADFS login round trip no longer lands here — librarytools-auth
// owns the fixed /mrbs redirect_uri directly now (see the plan, Fas 1) and
// hands the browser straight to src/proxy.ts's session upgrade instead.
export default async function Home() {
  redirect("/rooms");
}

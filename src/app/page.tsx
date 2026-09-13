import { redirect } from "next/navigation";

// This is also where KTH's OIDC login redirects back to — the reused Entra ID
// app registration's only allowed redirect URI is the app's own root (see
// src/lib/oidc.ts), so a `code`+`state` pair here means Entra ID is returning
// from a login, not a normal visit. This whole branch (and the /mrbs-specific
// framing) goes away once a dedicated app registration with its own callback
// URL exists — see src/app/api/auth/kth/finish/route.ts.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string }>;
}) {
  const { code, state } = await searchParams;
  if (code && state) {
    redirect(`/api/auth/kth/finish?${new URLSearchParams({ code, state })}`);
  }
  redirect("/rooms");
}

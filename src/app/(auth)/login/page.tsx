import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/get-dictionary";
import { withBasePath } from "@/lib/base-path";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const { returnTo, error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(returnTo && returnTo.startsWith("/") ? returnTo : "/rooms");
  const { t } = await getT();

  // The reused Entra ID app registration this points at only works once
  // deployed under its fixed redirect URI (see src/lib/oidc.ts) — hidden
  // rather than shown-but-broken until OIDC_ISSUER/OIDC_CLIENT_ID are set.
  const oidcEnabled = Boolean(process.env.OIDC_CLIENT_ID && process.env.OIDC_ISSUER);

  const oidcError =
    error === "oidc_state"
      ? t("auth.errors.oidcState")
      : error === "oidc_failed"
        ? t("auth.errors.oidcFailed")
        : undefined;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">{t("auth.login.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("auth.login.subtitle")}</p>
      {oidcError && <p className="mt-4 text-sm text-red-600">{oidcError}</p>}
      <LoginForm
        returnTo={returnTo}
        oidcEnabled={oidcEnabled}
        kthLoginHref={withBasePath(`/api/auth/kth/login?returnTo=${encodeURIComponent(returnTo ?? "")}`)}
      />
      <p className="mt-6 text-sm text-gray-500">
        {t("auth.login.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-kth-blue hover:underline">
          {t("auth.login.createHere")}
        </Link>
      </p>
    </div>
  );
}

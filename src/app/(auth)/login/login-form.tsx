"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { useI18n } from "@/components/i18n-provider";

export function LoginForm({
  returnTo,
  oidcEnabled,
  kthLoginHref,
}: {
  returnTo?: string;
  oidcEnabled: boolean;
  kthLoginHref: string;
}) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const { t } = useI18n();

  return (
    <>
      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="returnTo" value={returnTo ?? ""} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t("auth.login.emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t("auth.login.passwordLabel")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
        >
          {pending ? t("auth.login.submitPending") : t("auth.login.submit")}
        </button>
      </form>

      {oidcEnabled && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            {t("auth.login.orDivider")}
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <a
            href={kthLoginHref}
            className="rounded-md border border-kth-blue px-4 py-2 text-center text-sm font-medium text-kth-blue hover:bg-kth-light-blue"
          >
            {t("auth.login.kthButton")}
          </a>
        </>
      )}
    </>
  );
}

"use client";

import { logout } from "@/app/(auth)/actions";
import { useI18n } from "@/components/i18n-provider";

export function LogoutButton() {
  const { t } = useI18n();

  return (
    <form
      action={logout}
      // Inside the mobile nav dropdown (MobileNav), any click closes the
      // menu — desired for the links, but without this the menu (and this
      // form) unmounts before the server action ever fires, so the button
      // silently does nothing.
      onClick={(e) => e.stopPropagation()}
    >
      <button type="submit" className="text-kth-light-blue hover:text-white">
        {t("nav.logout")}
      </button>
    </form>
  );
}

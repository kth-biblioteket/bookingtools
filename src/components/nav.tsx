import Link from "next/link";
import Image from "next/image";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { getT } from "@/lib/i18n/get-dictionary";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";

export async function Nav() {
  const user = await getCurrentUser();
  const { t } = await getT();

  const links = user ? (
    <>
      <Link href="/rooms" className="text-kth-light-blue hover:text-white">
        {t("nav.rooms")}
      </Link>
      <Link href="/schedule" className="text-kth-light-blue hover:text-white">
        {t("nav.schedule")}
      </Link>
      <Link href="/bookings" className="text-kth-light-blue hover:text-white">
        {t("nav.myBookings")}
      </Link>
      {isAdminEmail(user.email) && (
        <Link href="/admin" className="text-kth-light-blue hover:text-white">
          {t("nav.admin")}
        </Link>
      )}
      <span className="text-kth-sky">{user.name}</span>
      <LanguageSwitcher />
      <form action={logout}>
        <button type="submit" className="text-kth-light-blue hover:text-white">
          {t("nav.logout")}
        </button>
      </form>
    </>
  ) : (
    <>
      <Link href="/login" className="text-kth-light-blue hover:text-white">
        {t("nav.login")}
      </Link>
      <LanguageSwitcher />
      <Link
        href="/signup"
        className="rounded-md bg-white px-3 py-1.5 text-center font-medium text-kth-blue hover:bg-kth-light-blue"
      >
        {t("nav.signup")}
      </Link>
    </>
  );

  return (
    <header className="relative bg-kth-navy">
      <div className="mx-auto flex h-24 max-w-5xl items-center justify-between px-4">
        <Link href="/rooms" className="flex items-center gap-3 text-lg font-semibold text-white">
          <Image src="/kth-logo-white.svg" alt="KTH" width={50} height={56} className="h-14 w-auto" priority />
          {t("nav.brand")}
        </Link>
        {/* Single row of links — only enough horizontal room on wider screens. */}
        <nav className="hidden items-center gap-4 text-sm sm:flex">{links}</nav>
        {/* Hamburger + dropdown with the same links, stacked, for narrow screens. */}
        <MobileNav menuLabel={t("nav.menu")}>{links}</MobileNav>
      </div>
    </header>
  );
}

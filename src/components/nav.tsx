import Link from "next/link";
import Image from "next/image";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getActiveSchedules } from "@/lib/schedules";
import { getT } from "@/lib/i18n/get-dictionary";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { withBasePath } from "@/lib/base-path";

export async function Nav() {
  const [user, schedules] = await Promise.all([getCurrentUser(), getActiveSchedules()]);
  const { t } = await getT();
  const admin = Boolean(user) && isAdmin(user!);

  const links = <NavLinks user={user} isAdmin={admin} schedules={schedules} />;

  return (
    <header className="relative bg-kth-navy">
      <div className="mx-auto flex h-24 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <Image
            src={withBasePath("/kth-logo-white.svg")}
            alt="KTH"
            width={57}
            height={64}
            className="h-16 w-auto"
            priority
          />
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

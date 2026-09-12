import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { I18nProvider } from "@/components/i18n-provider";
import { getT } from "@/lib/i18n/get-dictionary";

// Figtree is KTH's official brand typeface (see KTH's graphic manual).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("layout.title"),
    description: t("layout.description"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dict } = await getT();

  return (
    <html lang={locale} className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <I18nProvider locale={locale} dict={dict}>
          <Nav />
          <main className="flex flex-1 flex-col">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}

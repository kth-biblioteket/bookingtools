import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

// Figtree is KTH's official brand typeface (see KTH's graphic manual).
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KTH Grupprum",
  description: "Boka lediga grupprum på KTH",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-kth-sand text-gray-900">
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}

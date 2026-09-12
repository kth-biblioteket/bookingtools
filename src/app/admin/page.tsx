import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/rooms");

  const settings = await getSettings();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Admininställningar</h1>
      <p className="mt-1 text-sm text-gray-500">
        Styr vilka tider som går att boka: starttid måste vara en multipel av
        bokningsintervallet, och bokningens längd måste vara en multipel av
        intervallet, mellan minsta och längsta längd.
      </p>

      <SettingsForm settings={settings} />

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">Rum</h2>
        <p className="mt-1 text-sm text-gray-500">Lägg till eller ta bort grupprum.</p>
        <Link
          href="/admin/rooms"
          className="mt-2 inline-block text-sm font-medium text-kth-blue hover:underline"
        >
          Hantera rum →
        </Link>
      </div>
    </div>
  );
}

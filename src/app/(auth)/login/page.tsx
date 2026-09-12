import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/get-dictionary";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/rooms");
  const { t } = await getT();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">{t("auth.login.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("auth.login.subtitle")}</p>
      <LoginForm />
      <p className="mt-6 text-sm text-gray-500">
        {t("auth.login.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-kth-blue hover:underline">
          {t("auth.login.createHere")}
        </Link>
      </p>
    </div>
  );
}

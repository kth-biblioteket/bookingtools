import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/get-dictionary";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { t } = await getT();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">{t("auth.signup.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("auth.signup.subtitle")}</p>
      <SignupForm />
      <p className="mt-6 text-sm text-gray-500">
        {t("auth.signup.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-medium text-kth-blue hover:underline">
          {t("auth.signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}

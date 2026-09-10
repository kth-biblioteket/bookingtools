import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/rooms");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Skapa konto</h1>
      <p className="mt-1 text-sm text-gray-500">
        Boka lediga grupprum på KTH.
      </p>
      <SignupForm />
      <p className="mt-6 text-sm text-gray-500">
        Har du redan ett konto?{" "}
        <Link href="/login" className="font-medium text-blue-700 hover:underline">
          Logga in
        </Link>
      </p>
    </div>
  );
}

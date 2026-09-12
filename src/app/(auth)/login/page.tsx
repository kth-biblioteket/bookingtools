import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/rooms");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold text-gray-900">Logga in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Boka lediga grupprum på KTH.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-gray-500">
        Inget konto?{" "}
        <Link href="/signup" className="font-medium text-kth-blue hover:underline">
          Skapa ett här
        </Link>
      </p>
    </div>
  );
}

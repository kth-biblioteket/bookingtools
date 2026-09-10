import Link from "next/link";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/rooms" className="text-lg font-semibold text-gray-900">
          KTH Grupprum
        </Link>
        {user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/rooms" className="text-gray-600 hover:text-gray-900">
              Rum
            </Link>
            <Link href="/schedule" className="text-gray-600 hover:text-gray-900">
              Schema
            </Link>
            <Link href="/bookings" className="text-gray-600 hover:text-gray-900">
              Mina bokningar
            </Link>
            {isAdminEmail(user.email) && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}
            <span className="text-gray-400">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="text-gray-600 hover:text-gray-900">
                Logga ut
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Logga in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-700 px-3 py-1.5 font-medium text-white hover:bg-blue-800"
            >
              Skapa konto
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

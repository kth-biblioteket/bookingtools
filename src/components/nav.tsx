import Link from "next/link";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="bg-kth-blue">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/rooms" className="text-lg font-semibold text-white">
          KTH Grupprum
        </Link>
        {user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/rooms" className="text-kth-light-blue hover:text-white">
              Rum
            </Link>
            <Link href="/schedule" className="text-kth-light-blue hover:text-white">
              Schema
            </Link>
            <Link href="/bookings" className="text-kth-light-blue hover:text-white">
              Mina bokningar
            </Link>
            {isAdminEmail(user.email) && (
              <Link href="/admin" className="text-kth-light-blue hover:text-white">
                Admin
              </Link>
            )}
            <span className="text-kth-sky">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="text-kth-light-blue hover:text-white">
                Logga ut
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-kth-light-blue hover:text-white">
              Logga in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-white px-3 py-1.5 font-medium text-kth-blue hover:bg-kth-light-blue"
            >
              Skapa konto
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

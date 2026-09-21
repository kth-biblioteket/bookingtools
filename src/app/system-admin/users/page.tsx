import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/get-dictionary";
import { deleteUser } from "./delete-actions";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (!isAdmin(currentUser)) redirect("/");

  const [users, { t, locale }] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { bookings: { where: { endTime: { gte: new Date() } } } },
        },
      },
    }),
    getT(),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Link href="/system-admin" className="text-sm text-kth-blue hover:underline">
        {t("adminUsers.backToSettings")}
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-gray-900">{t("adminUsers.heading")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("adminUsers.subtitle")}</p>

      <div className="mt-6 space-y-2">
        {users.map((user) => {
          const isSelf = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <h3 className="flex items-center gap-2 font-medium text-gray-900">
                  {user.name}
                  {isSelf && <span className="text-xs font-normal text-gray-400">{t("adminUsers.youLabel")}</span>}
                  {isAdmin(user) && (
                    <span className="rounded-full bg-kth-light-blue px-2 py-0.5 text-xs font-medium text-kth-blue">
                      {t("adminUsers.adminBadge")}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("adminUsers.createdAt", { date: dateFormatter.format(user.createdAt) })}
                  {" · "}
                  {user._count.bookings > 0
                    ? t("adminRooms.upcomingBookingsCount", { n: user._count.bookings })
                    : t("adminRooms.noUpcomingBookings")}
                </p>
              </div>
              {!isSelf && <DeleteUserButton userId={user.id} action={deleteUser} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

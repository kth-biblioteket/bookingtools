"use client";

import { useTransition } from "react";
import { useI18n } from "@/components/i18n-provider";

export function ConfirmButton({
  bookingId,
  action,
}: {
  bookingId: string;
  action: (bookingId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action(bookingId))}
      className="text-xs font-medium text-green-700 hover:underline disabled:opacity-60"
    >
      {pending ? t("bookingStatus.confirmPending") : t("bookingStatus.confirm")}
    </button>
  );
}

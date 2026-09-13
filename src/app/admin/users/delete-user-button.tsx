"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n-provider";

export function DeleteUserButton({
  userId,
  action,
}: {
  userId: string;
  action: (userId: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-gray-600">{t("adminUsers.deleteConfirm")}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => action(userId))}
          className="font-medium text-red-600 hover:underline disabled:opacity-60"
        >
          {pending ? t("adminUsers.deleting") : t("adminUsers.deleteYes")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="text-gray-500 hover:underline"
        >
          {t("common.cancel")}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-600 hover:underline"
    >
      {t("adminUsers.delete")}
    </button>
  );
}

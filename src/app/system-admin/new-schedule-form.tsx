"use client";

import { useActionState } from "react";
import { createScheduleAction } from "./actions";
import { useI18n } from "@/components/i18n-provider";

export function NewScheduleForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(createScheduleAction, undefined);

  // Remounts (clearing the form) exactly when a new success message arrives
  // — no separate effect/counter needed to detect "did this submission
  // succeed", since a fresh success string is itself a new key.
  return (
    <form key={state?.success ?? ""} action={formAction} className="mt-4 flex flex-col gap-3">
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          {t("systemAdmin.slug")}
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          maxLength={50}
          placeholder={t("systemAdmin.slugPlaceholder")}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t("systemAdmin.name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t("systemAdmin.descriptionOptional")}
        </label>
        <input
          id="description"
          name="description"
          type="text"
          maxLength={300}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
      >
        {pending ? t("systemAdmin.addSubmitPending") : t("systemAdmin.addSubmit")}
      </button>
    </form>
  );
}

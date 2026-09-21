"use client";

import { useActionState, useState, useTransition } from "react";
import { renameScheduleAction, toggleScheduleActiveAction } from "./actions";
import { useI18n } from "@/components/i18n-provider";
import type { Schedule } from "@/generated/prisma/client";

export function ScheduleRow({ schedule }: { schedule: Schedule }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(renameScheduleAction, undefined);
  const [togglePending, startToggleTransition] = useTransition();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-gray-900">
            {schedule.name}
            <span className="text-xs font-normal text-gray-400">/{schedule.slug}</span>
            {!schedule.isActive && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                {t("systemAdmin.inactive")}
              </span>
            )}
          </h3>
          {schedule.description && <p className="text-sm text-gray-500">{schedule.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-sm font-medium text-kth-blue hover:underline"
          >
            {editing ? t("common.cancel") : t("systemAdmin.rename")}
          </button>
          <button
            type="button"
            disabled={togglePending}
            onClick={() =>
              startToggleTransition(async () => {
                await toggleScheduleActiveAction(schedule.id, !schedule.isActive);
              })
            }
            className="text-sm font-medium text-kth-blue hover:underline disabled:opacity-60"
          >
            {schedule.isActive ? t("systemAdmin.deactivate") : t("systemAdmin.activate")}
          </button>
        </div>
      </div>

      {editing && (
        <form action={formAction} className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
          <input type="hidden" name="id" value={schedule.id} />
          <input
            name="name"
            type="text"
            required
            maxLength={100}
            defaultValue={schedule.name}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          />
          <input
            name="description"
            type="text"
            maxLength={300}
            defaultValue={schedule.description ?? ""}
            placeholder={t("systemAdmin.descriptionOptional")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-md bg-kth-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
          >
            {pending ? t("systemAdmin.savingPending") : t("systemAdmin.save")}
          </button>
        </form>
      )}
    </div>
  );
}

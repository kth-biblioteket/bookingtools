"use client";

import { useActionState } from "react";
import { updateMap } from "./actions";
import { useI18n } from "@/components/i18n-provider";

export function MapForm({ scheduleSlug, mapSvg }: { scheduleSlug: string; mapSvg: string | null }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(updateMap, undefined);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="scheduleSlug" value={scheduleSlug} />
      <div>
        <label htmlFor="mapSvg" className="block text-sm font-medium text-gray-700">
          {t("admin.mapSvgLabel")}
        </label>
        <p className="mt-1 text-xs text-gray-500">{t("admin.mapSvgHint")}</p>
        <textarea
          id="mapSvg"
          name="mapSvg"
          rows={8}
          defaultValue={mapSvg ?? ""}
          placeholder="<svg viewBox=&quot;0 0 100 100&quot;>...</svg>"
          spellCheck={false}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:border-kth-blue focus:outline-none focus:ring-1 focus:ring-kth-blue"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-kth-blue px-4 py-2 text-sm font-medium text-white hover:bg-kth-navy disabled:opacity-60"
      >
        {pending ? t("admin.saving") : t("admin.save")}
      </button>
    </form>
  );
}

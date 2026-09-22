"use client";

import { useActionState, useRef, useState } from "react";
import { updateMap } from "./actions";
import { useI18n } from "@/components/i18n-provider";

export function MapForm({ scheduleSlug, mapSvg }: { scheduleSlug: string; mapSvg: string | null }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(updateMap, undefined);
  // Controlled so picking a .svg file can fill it in — the file itself is
  // never submitted, only read into this text field (the server only ever
  // deals with the same sanitized-SVG-as-text shape either way).
  const [svgText, setSvgText] = useState(mapSvg ?? "");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      setFileError(t("admin.errors.mapInvalid"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSvgText(await file.text());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="scheduleSlug" value={scheduleSlug} />
      <div>
        <label htmlFor="mapSvgFile" className="block text-sm font-medium text-gray-700">
          {t("admin.mapSvgLabel")}
        </label>
        <p className="mt-1 text-xs text-gray-500">{t("admin.mapSvgHint")}</p>
        <input
          ref={fileInputRef}
          id="mapSvgFile"
          type="file"
          accept=".svg,image/svg+xml"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
          className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-kth-blue file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-kth-navy"
        />
        {fileError && <p className="mt-1 text-sm text-red-600">{fileError}</p>}
        <p className="mt-3 text-xs text-gray-500">{t("admin.mapSvgPasteHint")}</p>
        <textarea
          id="mapSvg"
          name="mapSvg"
          rows={8}
          value={svgText}
          onChange={(e) => setSvgText(e.target.value)}
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

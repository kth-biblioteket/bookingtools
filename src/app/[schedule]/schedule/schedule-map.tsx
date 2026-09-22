"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

/**
 * The map is admin-supplied, already-sanitized SVG markup (see
 * src/lib/svg-sanitize.ts on the write path) — safe to render raw here.
 * Hidden by default per the room-map feature's spec: shown only when the
 * visitor asks for it, not on every page load.
 */
export function ScheduleMap({ mapSvg }: { mapSvg: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-kth-blue hover:underline"
      >
        {open ? t("schedule.hideMap") : t("schedule.showMap")}
      </button>
      {open && (
        <div
          className="mt-3 max-w-2xl rounded-lg border border-gray-200 bg-white p-4"
          dangerouslySetInnerHTML={{ __html: mapSvg }}
        />
      )}
    </div>
  );
}

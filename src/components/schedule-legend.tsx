"use client";

import { useI18n } from "@/components/i18n-provider";

function Swatch({ className }: { className: string }) {
  return <span className={`inline-block h-3.5 w-3.5 shrink-0 rounded-sm ${className}`} />;
}

/** Explains the schedule grid's colors — shown under both the single-day
 * (all rooms) and single-room (week) schedule views. */
export function ScheduleLegend({
  requirePreliminaryConfirmation,
}: {
  requirePreliminaryConfirmation: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-red-200" />
        {t("legend.confirmedBooking")}
      </span>
      {requirePreliminaryConfirmation && (
        <>
          <span className="flex items-center gap-1.5">
            <Swatch className="bg-yellow-200" />
            {t("legend.preliminaryBooking")}
          </span>
          <span className="flex items-center gap-1.5">
            <Swatch className="bg-orange-200" />
            {t("legend.needsConfirmationBooking")}
          </span>
        </>
      )}
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-red-200 ring-2 ring-inset ring-kth-sky" />
        {t("legend.ownBooking")}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm bg-slate-300/50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(71,85,105,0.35) 0px, rgba(71,85,105,0.35) 3px, transparent 3px, transparent 6px)",
          }}
        />
        {t("legend.beingBooked")}
      </span>
      <span className="flex items-center gap-1.5">
        <Swatch className="bg-gray-300/80" />
        {t("legend.unavailable")}
      </span>
    </div>
  );
}

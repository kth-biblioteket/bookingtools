/**
 * The corner cell shared by both schedule layouts, where the room axis meets
 * the time axis. Split diagonally — the half facing the rooms matches their
 * kth-sky background and says "Rum"; the half facing the hours matches their
 * kth-blue background and says "Tid". clip-path (not a gradient) guarantees
 * the split runs exactly corner-to-corner regardless of this cell's actual
 * width/height.
 */
export function ScheduleCornerCell({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-kth-sky" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }} />
      <div className="absolute inset-0 bg-kth-blue" style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }} />
      {/* Positioned at each triangle's centroid — the average of its three
          corners — so the label sits centered within its own half rather
          than the cell as a whole. */}
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white"
        style={{ left: "66.7%", top: "33.3%" }}
      >
        Rum
      </span>
      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white"
        style={{ left: "33.3%", top: "66.7%" }}
      >
        Tid
      </span>
    </div>
  );
}

/**
 * The corner cell shared by both schedule layouts, where the room axis meets
 * the time axis. Split diagonally — the half facing the rooms matches their
 * kth-sky background and says "Rum"; the half facing the hours matches their
 * kth-blue background and says "Tid". clip-path (not a gradient) guarantees
 * the split runs exactly corner-to-corner regardless of this cell's actual
 * width/height.
 *
 * Which triangle gets which label/color depends on which side that axis
 * actually continues on: in the vertical layout, rooms run along the top
 * (to the right of this cell) and hours run down the left (below this
 * cell), so "Rum" belongs in the top-right triangle. In the horizontal
 * layout, hours run along the top (to the right of this cell) and rooms
 * run down the left (below this cell) instead — the axes are swapped, so
 * `roomsAt` flips which triangle is which.
 */
export function ScheduleCornerCell({
  roomsAt = "top-right",
  roomsLabel = "Rum",
  className = "",
}: {
  roomsAt?: "top-right" | "bottom-left";
  /** Label for the non-time axis — "Rum" for the multi-room schedules, "Dag" for a single room's week view. */
  roomsLabel?: string;
  className?: string;
}) {
  const roomsClip =
    roomsAt === "top-right" ? "polygon(0 0, 100% 0, 100% 100%)" : "polygon(0 0, 0 100%, 100% 100%)";
  const hoursClip =
    roomsAt === "top-right" ? "polygon(0 0, 0 100%, 100% 100%)" : "polygon(0 0, 100% 0, 100% 100%)";
  // Each label sits at its triangle's centroid — the average of its three
  // corners — so it's centered within its own half rather than the cell as
  // a whole.
  const roomsPos = roomsAt === "top-right" ? { left: "66.7%", top: "33.3%" } : { left: "33.3%", top: "66.7%" };
  const hoursPos = roomsAt === "top-right" ? { left: "33.3%", top: "66.7%" } : { left: "66.7%", top: "33.3%" };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-kth-sky" style={{ clipPath: roomsClip }} />
      <div className="absolute inset-0 bg-kth-blue" style={{ clipPath: hoursClip }} />
      <span className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white" style={roomsPos}>
        {roomsLabel}
      </span>
      <span className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-white" style={hoursPos}>
        Tid
      </span>
    </div>
  );
}

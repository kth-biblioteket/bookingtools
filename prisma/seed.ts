import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient();

const ROOM_COUNT = 21;
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 12;

function randomCapacity() {
  return MIN_CAPACITY + Math.floor(Math.random() * (MAX_CAPACITY - MIN_CAPACITY + 1));
}

function randomBool() {
  return Math.random() < 0.5;
}

const rooms = Array.from({ length: ROOM_COUNT }, (_, i) => {
  const number = i + 1;
  return {
    name: String(number),
    roomNumber: number,
    building: "Biblioteket",
    campus: "KTH Campus",
    capacity: randomCapacity(),
    hasScreen: false,
    hasWhiteboard: randomBool(),
  };
});

async function main() {
  // The one real schedule that existed before Fas 2's multi-schedule split
  // — fixed id/slug to match the "grupprum" row the add_schedules migration
  // backfills, so re-running the seed against an already-migrated database
  // finds it instead of creating a duplicate.
  const schedule = await db.schedule.upsert({
    where: { slug: "grupprum" },
    update: {},
    create: { id: "grupprum", slug: "grupprum", name: "Grupprum" },
  });

  // Replaces whatever example rooms existed before — this is seed/demo
  // data only, never real bookings (nothing here cascades onto real user
  // data since there are none to begin with in a freshly seeded database).
  await db.room.deleteMany({ where: { scheduleId: schedule.id } });

  for (const room of rooms) {
    await db.room.create({ data: { ...room, scheduleId: schedule.id } });
  }
  console.log(`Seedade ${rooms.length} rum under schemat "${schedule.slug}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

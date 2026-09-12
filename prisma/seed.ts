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
  // Replaces whatever example rooms existed before — this is seed/demo
  // data only, never real bookings (nothing here cascades onto real user
  // data since there are none to begin with in a freshly seeded database).
  await db.room.deleteMany({});

  for (const room of rooms) {
    await db.room.create({ data: room });
  }
  console.log(`Seedade ${rooms.length} rum.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

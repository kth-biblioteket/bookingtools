import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient();

const rooms = [
  {
    name: "E2E Testrum 1",
    roomNumber: 1,
    building: "Testbyggnaden",
    campus: "KTH Campus",
    capacity: 4,
    floor: "1",
    hasScreen: false,
    hasWhiteboard: true,
  },
  {
    name: "E2E Testrum 2",
    roomNumber: 2,
    building: "Testbyggnaden",
    campus: "KTH Campus",
    capacity: 6,
    floor: "1",
    hasScreen: true,
    hasWhiteboard: true,
  },
  {
    name: "E2E Testrum 3",
    roomNumber: 3,
    building: "Testbyggnaden",
    campus: "KTH Kista",
    capacity: 8,
    floor: "2",
    hasScreen: true,
    hasWhiteboard: false,
  },
];

async function main() {
  for (const room of rooms) {
    await db.room.create({ data: room });
  }
  console.log(`Seedade ${rooms.length} testrum i test-databasen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

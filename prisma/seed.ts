import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient();

const rooms = [
  { name: "Grupprum 1", building: "Biblioteket", campus: "KTH Campus", capacity: 4, floor: "2", hasScreen: false, hasWhiteboard: true },
  { name: "Grupprum 2", building: "Biblioteket", campus: "KTH Campus", capacity: 4, floor: "2", hasScreen: false, hasWhiteboard: true },
  { name: "Grupprum 3", building: "Biblioteket", campus: "KTH Campus", capacity: 6, floor: "3", hasScreen: true, hasWhiteboard: true },
  { name: "Grupprum 4", building: "Biblioteket", campus: "KTH Campus", capacity: 6, floor: "3", hasScreen: true, hasWhiteboard: false },
  { name: "Rum 101", building: "Kistahuset", campus: "KTH Kista", capacity: 8, floor: "1", hasScreen: true, hasWhiteboard: true },
  { name: "Rum 102", building: "Kistahuset", campus: "KTH Kista", capacity: 4, floor: "1", hasScreen: false, hasWhiteboard: true },
  { name: "Studierum A", building: "Nymble", campus: "KTH Campus", capacity: 5, floor: "1", hasScreen: false, hasWhiteboard: false },
  { name: "Studierum B", building: "Nymble", campus: "KTH Campus", capacity: 5, floor: "1", hasScreen: true, hasWhiteboard: true },
  { name: "Grupprum Elarken", building: "Elektro", campus: "KTH Campus", capacity: 6, floor: "0", hasScreen: true, hasWhiteboard: true },
  { name: "Grupprum Sing Sing", building: "Sing Sing", campus: "KTH Campus", capacity: 10, floor: "1", hasScreen: true, hasWhiteboard: true },
];

async function main() {
  for (const room of rooms) {
    const existing = await db.room.findFirst({
      where: { name: room.name, building: room.building },
    });
    if (!existing) {
      await db.room.create({ data: room });
    }
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

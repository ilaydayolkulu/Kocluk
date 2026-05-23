const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const assignments = await prisma.assignment.findMany();
    const statuses = [...new Set(assignments.map(a => a.status))];
    console.log("Existing statuses in DB:", statuses);
    
    // Actually, prisma might crash on findMany if the enum doesn't match!
    // So let's do a raw query.
    const rawStatuses = await prisma.$queryRaw`SELECT DISTINCT status FROM Assignment`;
    console.log("Raw statuses in DB:", rawStatuses);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

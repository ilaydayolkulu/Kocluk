const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // get a teacher and a student
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    
    if (!teacher || !student) {
      console.log('No teacher or student found');
      return;
    }
    
    const assignmentData = [{
      title: 'Test Assignment',
      content: 'Test content',
      status: 'PENDING',
      dueDate: new Date(),
      fileUrl: null,
      teacherId: teacher.id,
      studentId: student.id
    }];

    const result = await prisma.assignment.createMany({
      data: assignmentData
    });
    console.log('Success:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();

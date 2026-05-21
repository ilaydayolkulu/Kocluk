const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.practiceExam.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: { email: 'admin@egitimkocu.com', password: 'pwd', name: 'Sistem Yöneticisi', role: 'ADMIN' },
  });

  const teacher1 = await prisma.user.create({
    data: { email: 'teacher1@egitimkocu.com', password: 'pwd', name: 'Ahmet Hoca', role: 'TEACHER' },
  });

  const students = [];
  for (let i = 1; i <= 3; i++) {
    const student = await prisma.user.create({
      data: { email: `student${i}@egitimkocu.com`, password: 'pwd', name: `Öğrenci ${i}`, role: 'STUDENT' },
    });
    students.push(student);
  }

  for (const student of students) {
    // Exams
    await prisma.practiceExam.create({
      data: { examName: 'Eylül TYT Denemesi', examType: 'TYT', totalNet: 87.0, tytTurkish: 32.5, tytMath: 28.0, tytSocial: 14.0, tytScience: 12.5, studentId: student.id },
    });
    await prisma.practiceExam.create({
      data: { examName: 'Ekim TYT Denemesi', examType: 'TYT', totalNet: 92.5, tytTurkish: 35.0, tytMath: 30.0, tytSocial: 13.5, tytScience: 14.0, studentId: student.id },
    });
    await prisma.practiceExam.create({
      data: { examName: 'Ekim AYT Denemesi (Sayısal)', examType: 'AYT', totalNet: 55.5, aytMath: 31.0, aytScience: 24.5, studentId: student.id },
    });
    await prisma.practiceExam.create({
      data: { examName: 'Kasım AYT Denemesi (Sayısal)', examType: 'AYT', totalNet: 62.0, aytMath: 33.5, aytScience: 28.5, studentId: student.id },
    });

    // Assignments
    await prisma.assignment.create({
      data: {
        title: 'Matematik Sınav Hazırlığı',
        content: 'Üslü sayılar 50 soru çözülecek.',
        status: 'COMPLETED',
        dueDate: new Date(),
        teacherId: teacher1.id,
        studentId: student.id
      }
    });
    await prisma.assignment.create({
      data: {
        title: 'Tarih Projesi Araştırması',
        content: 'Osmanlı tarihi ödev araştırması.',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        teacherId: teacher1.id,
        studentId: student.id
      }
    });
    await prisma.assignment.create({
      data: {
        title: 'Fizik Ödevini Gönder',
        content: 'Vektörler testi',
        status: 'COMPLETED',
        dueDate: new Date(),
        teacherId: teacher1.id,
        studentId: student.id
      }
    });
    await prisma.assignment.create({
      data: {
        title: 'İngilizce Kelime Çalışması',
        content: '1. Ünite kelimeleri',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
        teacherId: teacher1.id,
        studentId: student.id
      }
    });
  }

  console.log('Seeding completed successfully!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

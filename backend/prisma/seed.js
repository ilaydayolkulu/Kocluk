const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await prisma.practiceExam.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash('12345', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@egitimkocu.com', password: hashedPassword, name: 'Sistem Yöneticisi', role: 'ADMIN' },
  });

  const teacherCan = await prisma.user.create({
    data: { email: 'can.yilmaz@egitimkocu.com', password: hashedPassword, name: 'Can Yılmaz', role: 'TEACHER' },
  });

  const teacherZeynep = await prisma.user.create({
    data: { email: 'zeynep.kaya@egitimkocu.com', password: hashedPassword, name: 'Zeynep Kaya', role: 'TEACHER' },
  });

  const studentMert = await prisma.user.create({
    data: { email: 'mert.demir@gmail.com', password: hashedPassword, name: 'Mert Demir', role: 'STUDENT' },
  });

  const studentSelin = await prisma.user.create({
    data: { email: 'selin.cetin@gmail.com', password: hashedPassword, name: 'Selin Çetin', role: 'STUDENT' },
  });

  const studentBurak = await prisma.user.create({
    data: { email: 'burak.ozturk@hotmaıl.com', password: hashedPassword, name: 'Burak Öztürk', role: 'STUDENT' },
  });

  // Mert Demir (Sayısal)
  await prisma.practiceExam.create({
    data: { examName: 'Eylül TYT Denemesi', examType: 'TYT', totalNet: 87.0, tytTurkish: 32.5, tytMath: 28.0, tytSocial: 14.0, tytScience: 12.5, studentId: studentMert.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim TYT Denemesi', examType: 'TYT', totalNet: 92.5, tytTurkish: 35.0, tytMath: 30.0, tytSocial: 13.5, tytScience: 14.0, studentId: studentMert.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim AYT (Sayısal)', examType: 'AYT', totalNet: 55.5, aytMath: 31.0, aytScience: 24.5, studentId: studentMert.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Kasım AYT (Sayısal)', examType: 'AYT', totalNet: 62.0, aytMath: 33.5, aytScience: 28.5, studentId: studentMert.id },
  });

  // Selin Çetin (Eşit Ağırlık)
  await prisma.practiceExam.create({
    data: { examName: 'Eylül TYT Denemesi', examType: 'TYT', totalNet: 75.25, tytTurkish: 33.0, tytMath: 18.25, tytSocial: 16.0, tytScience: 8.0, studentId: studentSelin.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim TYT Denemesi', examType: 'TYT', totalNet: 79.5, tytTurkish: 35.5, tytMath: 20.0, tytSocial: 15.0, tytScience: 9.0, studentId: studentSelin.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim AYT (Eşit Ağırlık)', examType: 'AYT', totalNet: 48.0, aytMath: 20.0, aytEdSos1: 28.0, studentId: studentSelin.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Kasım AYT (Eşit Ağırlık)', examType: 'AYT', totalNet: 54.5, aytMath: 24.5, aytEdSos1: 30.0, studentId: studentSelin.id },
  });

  // Burak Öztürk (Sözel)
  await prisma.practiceExam.create({
    data: { examName: 'Eylül TYT Denemesi', examType: 'TYT', totalNet: 65.5, tytTurkish: 34.0, tytMath: 8.5, tytSocial: 18.0, tytScience: 5.0, studentId: studentBurak.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim TYT Denemesi', examType: 'TYT', totalNet: 70.0, tytTurkish: 36.5, tytMath: 10.0, tytSocial: 17.5, tytScience: 6.0, studentId: studentBurak.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Ekim AYT (Sözel)', examType: 'AYT', totalNet: 62.5, aytEdSos1: 31.0, aytSocial2: 31.5, studentId: studentBurak.id },
  });
  await prisma.practiceExam.create({
    data: { examName: 'Kasım AYT (Sözel)', examType: 'AYT', totalNet: 68.0, aytEdSos1: 34.0, aytSocial2: 34.0, studentId: studentBurak.id },
  });

  // Assignments for Mert (Can Yılmaz assigns)
  await prisma.assignment.create({
    data: { title: 'AYT Matematik İntegral', content: 'İntegral fasikülünden ilk 3 test çözülecek.', status: 'COMPLETED', dueDate: new Date(), teacherId: teacherCan.id, studentId: studentMert.id }
  });
  await prisma.assignment.create({
    data: { title: 'AYT Fizik Çembersel Hareket', content: 'Çembersel hareket tekrarı ve 50 soru.', status: 'PENDING', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), teacherId: teacherCan.id, studentId: studentMert.id }
  });

  // Assignments for Selin (Zeynep Kaya assigns)
  await prisma.assignment.create({
    data: { title: 'AYT Edebiyat Cumhuriyet Dönemi', content: 'Cumhuriyet dönemi yazarları tablosu ezberlenecek.', status: 'COMPLETED', dueDate: new Date(), teacherId: teacherZeynep.id, studentId: studentSelin.id }
  });
  await prisma.assignment.create({
    data: { title: 'AYT Matematik Limit', content: 'Limit test 4 ve 5 bitecek.', status: 'PENDING', dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), teacherId: teacherZeynep.id, studentId: studentSelin.id }
  });

  // Assignments for Burak (Can Yılmaz assigns)
  await prisma.assignment.create({
    data: { title: 'AYT Tarih Çağdaş Türk ve Dünya Tarihi', content: 'Soğuk savaş dönemi özet çıkarılacak.', status: 'COMPLETED', dueDate: new Date(), teacherId: teacherCan.id, studentId: studentBurak.id }
  });
  await prisma.assignment.create({
    data: { title: 'TYT Türkçe Paragraf', content: 'Günde 30 paragraf sorusu rutini.', status: 'PENDING', dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), teacherId: teacherCan.id, studentId: studentBurak.id }
  });

  console.log('Seeding completed successfully with realistic data!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

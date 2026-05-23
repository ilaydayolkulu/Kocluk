const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Mevcut veriler temizleniyor...");
  await prisma.assignment.deleteMany();
  await prisma.practiceExam.deleteMany();
  await prisma.user.deleteMany();

  console.log("Yeni veriler oluşturuluyor...");
  const passwordHash = await bcrypt.hash('12345', 10);

  // TEACHER VE ADMIN EKLENMESİ
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Yönetici',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Eğitim Koçu',
      email: 'teacher@test.com',
      password: passwordHash,
      role: 'TEACHER'
    }
  });

  // 20 GERÇEKÇİ ÖĞRENCİ VERİSİ
  const studentData = [
    // 6 SAYISAL (SAY)
    { name: 'Mert Demir', email: 'mert.demir@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    { name: 'Selin Çetin', email: 'selin.cetin@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    { name: 'Ali Yılmaz', email: 'ali.yilmaz@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    { name: 'Zehra Arslan', email: 'zehra.arslan@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    { name: 'Emre Can', email: 'emre.can@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    { name: 'Aylin Yüksel', email: 'aylin.yuksel@test.com', department: 'SAY', role: 'STUDENT', password: passwordHash },
    
    // 6 EŞİT AĞIRLIK (EA)
    { name: 'Burak Öztürk', email: 'burak.ozturk@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    { name: 'Ayşe Kaya', email: 'ayse.kaya@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    { name: 'Zeynep Çelik', email: 'zeynep.celik@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    { name: 'Cem Yıldız', email: 'cem.yildiz@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    { name: 'Merve Kılıç', email: 'merve.kilic@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    { name: 'Oğuzhan Tekin', email: 'oguzhan.tekin@test.com', department: 'EA', role: 'STUDENT', password: passwordHash },
    
    // 5 SÖZEL (SOZ)
    { name: 'Mehmet Polat', email: 'mehmet.polat@test.com', department: 'SOZ', role: 'STUDENT', password: passwordHash },
    { name: 'Fatma Şahin', email: 'fatma.sahin@test.com', department: 'SOZ', role: 'STUDENT', password: passwordHash },
    { name: 'Ahmet Polat', email: 'ahmet.polat@test.com', department: 'SOZ', role: 'STUDENT', password: passwordHash },
    { name: 'Elif Doğan', email: 'elif.dogan@test.com', department: 'SOZ', role: 'STUDENT', password: passwordHash },
    { name: 'Kerem Koç', email: 'kerem.koc@test.com', department: 'SOZ', role: 'STUDENT', password: passwordHash },

    // 3 DİL (DIL)
    { name: 'Deniz Aydın', email: 'deniz.aydin@test.com', department: 'DIL', role: 'STUDENT', password: passwordHash },
    { name: 'Buse Kurt', email: 'buse.kurt@test.com', department: 'DIL', role: 'STUDENT', password: passwordHash },
    { name: 'Tolga Şen', email: 'tolga.sen@test.com', department: 'DIL', role: 'STUDENT', password: passwordHash }
  ];

  const createdStudents = [];
  for (const s of studentData) {
    const student = await prisma.user.create({ data: s });
    createdStudents.push(student);
  }

  // BAZI ÖĞRENCİLERE ÖDEV VE DENEME SINAVI EKLENMESİ
  const mert = createdStudents.find(s => s.name === 'Mert Demir');
  const selin = createdStudents.find(s => s.name === 'Selin Çetin');
  const burak = createdStudents.find(s => s.name === 'Burak Öztürk');
  const deniz = createdStudents.find(s => s.name === 'Deniz Aydın');

  if (mert) {
    await prisma.assignment.create({
      data: {
        title: 'Türev Karma Testler',
        content: 'Acil Matematik Türev fasikülü bitirilecek.',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 gün sonra
        studentId: mert.id,
        teacherId: teacher.id
      }
    });

    await prisma.practiceExam.create({
      data: {
        examName: 'Özdebir Türkiye Geneli',
        examType: 'TYT',
        totalNet: 92.5,
        tytTurkish: 35,
        tytMath: 32,
        tytSocial: 12.5,
        tytScience: 13,
        studentId: mert.id
      }
    });
  }

  if (selin) {
    await prisma.assignment.create({
      data: {
        title: 'Fizik Elektrik Konu Özeti',
        content: 'Elektrik akımı ve devreler konusu özetlenecek.',
        status: 'COMPLETED',
        dueDate: new Date(), // Bugün
        studentId: selin.id,
        teacherId: teacher.id
      }
    });
  }

  if (burak) {
    await prisma.assignment.create({
      data: {
        title: 'Edebiyat Divan Şiiri Çıkmış Sorular',
        content: 'Son 5 yılın divan şiiri çıkmış soruları analiz edilecek.',
        status: 'PENDING',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Yarın
        studentId: burak.id,
        teacherId: teacher.id
      }
    });
  }

  console.log(`Eğitim Koçu ve Admin başarıyla eklendi.`);
  console.log(`20 YKS Öğrencisi dengeli alan dağılımıyla başarıyla eklendi.`);
  console.log("Bazı öğrencilere dinamik deneme sınavı ve ödev atamaları yapıldı.");
  console.log("Seed işlemi sorunsuz tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

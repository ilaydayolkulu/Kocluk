const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testFetch() {
  try {
    const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!teacher || !student) return console.log('No teacher/student');

    const token = jwt.sign({ id: teacher.id, role: 'TEACHER' }, 'gizli-anahtar-kocluk-2026', { expiresIn: '1d' });

    const form = new FormData();
    form.append('studentIds', JSON.stringify([student.id]));
    form.append('title', 'API Test');
    form.append('description', 'API Content');

    const res = await fetch('http://localhost:5000/api/assignments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testFetch();

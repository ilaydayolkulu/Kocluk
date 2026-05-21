const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. GET /api/students
// Fetch all students to populate dropdowns in the frontend
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Öğrenciler getirilirken bir hata oluştu.' });
  }
});

// 2. GET /api/exams/student/:studentId
// Fetch practice exams for a specific student, chronologically ordered
app.get('/api/exams/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const exams = await prisma.practiceExam.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { createdAt: 'asc' }
    });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Sınav verileri getirilirken bir hata oluştu.' });
  }
});

// 3. GET /api/assignments/student/:studentId
// Fetch assignments for a specific student
app.get('/api/assignments/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const assignments = await prisma.assignment.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { dueDate: 'asc' }
    });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Ödev verileri getirilirken bir hata oluştu.' });
  }
});

// 4. GET /api/teacher/stats
// Teacher dashboard stats
app.get('/api/teacher/stats', async (req, res) => {
  try {
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const completedTasks = await prisma.assignment.count({ where: { status: 'COMPLETED' } });
    const pendingTasks = await prisma.assignment.count({ where: { status: 'PENDING' } });
    res.json({ activeStudents, completedTasks, pendingTasks });
  } catch (error) {
    res.status(500).json({ error: 'Stats error' });
  }
});

// 5. GET /api/progress/student/:studentId
// Mock daily progress chart data based on studentId
app.get('/api/progress/student/:studentId', async (req, res) => {
  try {
    // Generate some dynamic looking data based on current assignments
    const { studentId } = req.params;
    const count = await prisma.assignment.count({ where: { studentId: parseInt(studentId) } });
    const base = count * 10;
    
    const chartData = [
      { day: "Pzt", current: base + 10, planned: base + 20 },
      { day: "Sal", current: base + 25, planned: base + 30 },
      { day: "Çar", current: base + 20, planned: base + 35 },
      { day: "Per", current: base + 40, planned: base + 50 },
      { day: "Cum", current: base + 60, planned: base + 65 },
      { day: "Cts", current: base + 70, planned: base + 75 },
      { day: "Paz", current: base + 80, planned: base + 80 },
    ];
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Progress error' });
  }
});

// Generic test route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Pong' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

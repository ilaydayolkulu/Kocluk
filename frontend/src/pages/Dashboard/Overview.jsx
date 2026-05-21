import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

export default function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [latestExam, setLatestExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tüm verileri paralel çek
    const studentId = 4;
    Promise.all([
      fetch(`http://localhost:5000/api/assignments/student/${studentId}`).then(res => res.json()),
      fetch(`http://localhost:5000/api/progress/student/${studentId}`).then(res => res.json()),
      fetch(`http://localhost:5000/api/exams/student/${studentId}`).then(res => res.json())
    ])
    .then(([tasksData, progressData, examsData]) => {
      if (Array.isArray(tasksData)) {
        setTasks(tasksData.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status === 'COMPLETED' ? "Tamamlandı" : (task.status === 'LATE' ? "Gecikti" : "Bekliyor"),
          checked: task.status === 'COMPLETED'
        })));
      }
      
      if (Array.isArray(progressData)) {
        setChartData(progressData);
      }
      
      if (Array.isArray(examsData)) {
        const tytExams = examsData.filter(e => e.examType === 'TYT');
        if (tytExams.length > 0) {
          setLatestExam(tytExams[tytExams.length - 1]);
        }
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Veriler çekilemedi:", err);
      setLoading(false);
    });
  }, []);

  const totalQuestions = 120;
  const tytTurkish = latestExam?.tytTurkish || 0;
  const tytMath = latestExam?.tytMath || 0;
  const tytScience = latestExam?.tytScience || 0;
  const tytSocial = latestExam?.tytSocial || 0;
  
  const totalNet = tytTurkish + tytMath + tytScience + tytSocial;
  const percentage = Math.round((totalNet / totalQuestions) * 100) || 0;

  return (
    <>
      {/* Karşılama */}
      <div className="text-center md:text-left space-y-2 py-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Hoş geldin Ahmet!</h1>
        <p className="text-slate-500 italic text-sm md:text-base">Bugün yapacağın küçük adımlar, yarınki büyük başarıların temelidir.</p>
      </div>

      {/* Orta İki Kolon: Görevler ve Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Görevler Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Bugünkü Görevlerim</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500 text-sm">Ödevler yükleniyor...</p>
            ) : tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">Bugün için planlanmış bir ödevin bulunmuyor.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                      {task.checked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                    </div>
                    <span className={`text-sm md:text-base font-medium ${task.checked ? 'text-slate-700' : 'text-slate-500'}`}>{task.title}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.checked ? 'bg-blue-500 text-white' : (task.status === 'Gecikti' ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500')}`}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* İlerleme Grafiği Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Haftalık İlerleme</h2>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-4 h-1 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-slate-500">Tamamlanması gereken ilerlemeyi planlar</span>
          </div>
          <div className="flex-1 min-h-[200px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="planned" stroke="#93c5fd" strokeWidth={3} dot={false} strokeOpacity={0.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Son Deneme Sınavı Sonuçları */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Son Deneme Sınavı Sonuçları</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* İstatistikler Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 w-full md:w-2/3">
            <div>
              <p className="text-sm text-slate-500 mb-1">Türkçe:</p>
              <p className="text-3xl font-bold text-slate-800">{latestExam ? `${tytTurkish}/40` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Matematik:</p>
              <p className="text-3xl font-bold text-slate-800">{latestExam ? `${tytMath}/40` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Fen Bilimleri:</p>
              <p className="text-3xl font-bold text-slate-800">{latestExam ? `${tytScience}/20` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Sosyal Bilimler:</p>
              <p className="text-3xl font-bold text-slate-800">{latestExam ? `${tytSocial}/20` : '-'}</p>
            </div>
          </div>

          {/* Dairesel Progress */}
          <div className="flex flex-col items-center justify-center shrink-0 mt-4 md:mt-0">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-blue-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-500"
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{percentage}%</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3 font-medium">Başarı Yüzdesi</p>
          </div>

        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";

export default function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [latestExam, setLatestExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);

  const fetchDashboardData = () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      setLoading(false);
      return;
    }
    
    const user = JSON.parse(userStr);
    const studentId = user.id;

    const fetchOptions = {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };

    setLoading(true);
    Promise.all([
      fetch(`http://localhost:5000/api/assignments/student/${studentId}`, fetchOptions).then(res => res.json()),
      fetch(`http://localhost:5000/api/progress/student/${studentId}`, fetchOptions).then(res => res.json()),
      fetch(`http://localhost:5000/api/exams/student/${studentId}`, fetchOptions).then(res => res.json())
    ])
    .then(([tasksData, progressData, examsData]) => {
      if (Array.isArray(tasksData)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const processedTasks = tasksData.map(task => {
          let displayStatus = "Bekliyor";
          
          if (task.status === 'COMPLETED') {
            displayStatus = "Tamamlandı";
          } else if (task.status === 'PENDING' && task.dueDate) {
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            
            if (taskDate < today) {
              displayStatus = "Gecikti";
            }
          }

          return {
            id: task.id,
            title: task.title,
            status: displayStatus,
            checked: task.status === 'COMPLETED',
            dueDate: task.dueDate,
            fileUrl: task.fileUrl
          };
        });
        
        const upcomingTasks = processedTasks
          .filter(task => task.status !== "Gecikti" && !!task.dueDate)
          .sort((a, b) => {
            return new Date(a.dueDate) - new Date(b.dueDate);
          })
          .slice(0, 5);

        setTasks(upcomingTasks);
      }
      
      if (Array.isArray(progressData)) {
        setChartData(progressData);
      }
      
      if (Array.isArray(examsData)) {
        const tytExams = examsData.filter(e => e.examType === 'TYT');
        if (tytExams.length > 0) {
          setLatestExam(tytExams[tytExams.length - 1]);
        } else {
          setLatestExam(null);
        }
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Veriler çekilemedi:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTaskClick = (task) => {
    // Kilit: Eğer görev zaten tamamlandıysa hiçbir işlem yapma
    if (task.checked) return;
    
    // Görevi tamamlamak istiyorsa modalı aç
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalConfirm = async ({ file, studentNote }) => {
    if (!selectedTask) return;
    
    // FormData hazırla
    const formData = new FormData();
    formData.append('status', 'COMPLETED');
    if (studentNote) formData.append('studentNote', studentNote);
    if (file) formData.append('file', file);

    await handleStatusUpdate(selectedTask.id, 'COMPLETED', formData);
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleStatusUpdate = async (taskId, newStatus, formData = null) => {
    // 1. Optimistic Update (Ekranı anında güncelle)
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          checked: newStatus === 'COMPLETED', 
          status: newStatus === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor' 
        };
      }
      return task;
    }));

    // 2. Backend'e gönder
    try {
      const token = localStorage.getItem('token');
      const fetchOptions = {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      if (formData) {
        fetchOptions.body = formData;
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify({ status: newStatus });
      }

      const response = await fetch(`http://localhost:5000/api/assignments/${taskId}/status`, fetchOptions);
      if (response.ok) {
        const data = await response.json();
        if (data.updatedAssignment) {
          setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
              return { 
                ...task, 
                studentNote: data.updatedAssignment.studentNote,
                submittedFileUrl: data.updatedAssignment.submittedFileUrl
              };
            }
            return task;
          }));
        }
      }
    } catch (err) {
      console.error('Görev güncellenemedi:', err);
    }
  };

  const totalQuestions = 120;
  const tytTurkish = latestExam?.tytTurkish || 0;
  const tytMath = latestExam?.tytMath || 0;
  const tytScience = latestExam?.tytScience || 0;
  const tytSocial = latestExam?.tytSocial || 0;
  
  const totalNet = tytTurkish + tytMath + tytScience + tytSocial;
  const percentage = Math.round((totalNet / totalQuestions) * 100) || 0;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.name ? user.name.split(' ')[0] : 'Öğrenci';

  return (
    <>
      {/* Karşılama */}
      <div className="text-center md:text-left space-y-2 py-2">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Hoş geldin {firstName}!</h1>
        <p className="text-slate-500 italic text-sm md:text-base">Bugün yapacağın küçük adımlar, yarınki büyük başarıların temelidir.</p>
      </div>

      {/* Orta İki Kolon: Görevler ve Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Görevler Kartı */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Yaklaşan Görevlerim</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500 text-sm">Ödevler yükleniyor...</p>
            ) : tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">Yaklaşan bir görevin bulunmuyor.</p>
            ) : (
              tasks.map((task) => {
                let dateDisplay = null;
                if (task.dueDate) {
                  const taskDate = new Date(task.dueDate);
                  taskDate.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (taskDate.getTime() === today.getTime()) {
                    dateDisplay = "Bugün";
                  } else {
                    dateDisplay = taskDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  }
                }

                return (
                  <div key={task.id} className="flex flex-col gap-1.5 group pb-1">
                    <div className="flex items-center justify-between">
                      <div 
                        className={`flex items-center gap-3 select-none flex-1 ${
                          task.checked ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                        }`}
                        onClick={() => {
                          if (task.checked) return;
                          handleToggleTaskClick(task);
                        }}
                      >
                        <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {task.checked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <span className={`text-sm md:text-base font-medium transition-colors ${task.checked ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-blue-600'}`}>{task.title}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 mt-3 sm:mt-0">
                        {/* İncele Butonu */}
                        <button
                          onClick={() => {
                            setInspectTask(task);
                            setIsInspectOpen(true);
                          }}
                          className="bg-slate-50 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          İncele
                        </button>
                        {task.fileUrl && (
                          <a 
                            href={`http://localhost:5000${task.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1.5 border border-blue-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            Eki İndir
                          </a>
                        )}
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.checked ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    {/* Alt Tarih Satırı */}
                    {dateDisplay && !task.checked && (
                      <div className="pl-8 flex items-center gap-1.5 text-xs text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>Son Gün: {dateDisplay}</span>
                      </div>
                    )}
                  </div>
                );
              })
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Son Deneme Sınavı Sonuçları</h2>
        </div>
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

      {/* Confirmation Modal */}
      <TaskCompletionModal
        isOpen={isModalOpen}
        taskTitle={selectedTask?.title}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onConfirm={handleModalConfirm}
      />

      {/* Inspect Modal */}
      <TaskInspectModal 
        isOpen={isInspectOpen}
        onClose={() => {
          setIsInspectOpen(false);
          setInspectTask(null);
        }}
        task={inspectTask}
      />
    </>
  );
}

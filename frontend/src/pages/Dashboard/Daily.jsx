import React, { useState, useEffect } from "react";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);
  
  // Bugünün tarihini istenen formatta ("23 Mayıs Cumartesi") oluşturuyoruz
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('tr-TR', { month: 'long' });
  const weekday = today.toLocaleDateString('tr-TR', { weekday: 'long' });
  const customDateString = `${day} ${month} ${weekday}`;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!userStr || !token) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const studentId = user.id;

        const res = await fetch(`http://localhost:5000/api/assignments/student/${studentId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          
          // Gün sınırlarını ayarlıyoruz (00:00:00 ile 23:59:59 arası)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          // Gelen ödevlerden dueDate'i bugüne denk gelenleri süzüyoruz
          const dailyTasks = data.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate >= todayStart && taskDate <= todayEnd;
          });

          setTasks(dailyTasks);
        }
      } catch (err) {
        console.error("Görevler alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleToggleTaskClick = (task) => {
    // Kilit: Eğer görev zaten tamamlandıysa hiçbir işlem yapma
    if (task.status === 'COMPLETED') return;
    
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
    // 1. Optimistic Update
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

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

      await fetch(`http://localhost:5000/api/assignments/${taskId}/status`, fetchOptions);
    } catch (err) {
      console.error('Görev güncellenemedi:', err);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      
      {/* Başlık Alanı */}
      <div className="mb-8 border-b border-slate-100 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Bugünün Görevleri — <span className="text-blue-600">{customDateString}</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base">
          Sadece bugüne ait tamamlaman gereken görevler aşağıda listelenmiştir.
        </p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-400 font-medium animate-pulse">Görevler yükleniyor...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-700">Harika!</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Bugün tamamlaman gereken bir görev bulunmuyor. Günü kendine ayırabilir veya ekstra çalışmalar yapabilirsin. 🎉
          </p>
        </div>

      ) : (
        <div className="grid gap-4">
          {tasks.map(task => {
            const isCompleted = task.status === 'COMPLETED';
            
            return (
              <div 
                key={task.id} 
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${
                  isCompleted 
                    ? "bg-slate-50 border-slate-200 opacity-80 shadow-none" 
                    : "bg-white border-blue-100 hover:border-blue-300 hover:shadow-md shadow-blue-100/30"
                }`}
              >
                {/* Sol Alan: Checkbox ve Görev Bilgisi */}
                <div 
                  className={`flex items-start sm:items-center gap-5 flex-1 ${
                    isCompleted ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isCompleted) return;
                    handleToggleTaskClick(task);
                  }}
                >
                  {/* Yuvarlak Buton (Checkbox) */}
                  <div className={`mt-0.5 sm:mt-0 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? "bg-green-500 border-green-500 scale-105" 
                      : "border-slate-300 bg-white group-hover:border-blue-400"
                  }`}>
                    {isCompleted && (
                      <svg className="w-4 h-4 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-base font-bold transition-colors ${
                      isCompleted ? "text-slate-400 line-through" : "text-slate-800 group-hover:text-blue-600"
                    }`}>
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Atayan: <span className="font-medium text-slate-600">{task.teacher?.name || "Öğretmen"}</span>
                    </p>
                  </div>
                </div>

                {/* Sağ Alan: Butonlar ve Durum */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 mt-4 sm:mt-0 pl-12 sm:pl-0">
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
                
                {/* Sağ Alan: Dosya Eki */}
                {task.fileUrl && (
                  <div className="mt-4 sm:mt-0 pl-12 sm:pl-4 shrink-0">
                    <a 
                      href={`http://localhost:5000${task.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-semibold transition-all duration-300 border border-blue-100 hover:shadow-md hover:shadow-blue-200"
                      onClick={(e) => e.stopPropagation()} // Tıklama checkbox'ı tetiklemesin
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Eki İndir
                    </a>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}

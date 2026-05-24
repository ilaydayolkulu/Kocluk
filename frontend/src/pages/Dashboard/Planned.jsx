import React, { useState, useEffect } from "react";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import TaskInspectModal from "../../components/TaskInspectModal";

export default function PlannedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [inspectTask, setInspectTask] = useState(null);

  useEffect(() => {
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

    fetch(`http://localhost:5000/api/assignments/student/${studentId}`, fetchOptions)
      .then(res => res.json())
      .then(tasksData => {
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
              ...task,
              status: displayStatus,
              checked: task.status === 'COMPLETED'
            };
          });
          
          setTasks(processedTasks);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Görevler çekilemedi:", err);
        setLoading(false);
      });
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

      await fetch(`http://localhost:5000/api/assignments/${taskId}/status`, fetchOptions);
    } catch (err) {
      console.error('Görev güncellenemedi:', err);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Planlanan Görevler</h1>
        
        {/* Filtre Toggle (Şimdilik Görsel) */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button className="px-4 py-1.5 bg-white shadow-sm rounded text-sm font-medium text-slate-800">Tümü</button>
          <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Haftalık</button>
          <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Aylık</button>
        </div>
      </div>
      
      <p className="text-slate-500 mb-8">Atanmış tüm görevlerinizi buradan detaylı olarak inceleyebilir ve tamamlayabilirsiniz.</p>
      
      <div className="space-y-4 max-w-4xl">
        {loading ? (
          <p className="text-slate-500 text-sm">Görevler yükleniyor...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-500 text-sm">Henüz planlanmış bir göreviniz bulunmuyor.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between group p-4 border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all bg-slate-50 hover:bg-white gap-4">
              
              <div 
                className={`flex items-start sm:items-center gap-4 select-none flex-1 ${
                  task.checked ? "cursor-not-allowed opacity-90" : "cursor-pointer"
                }`}
                onClick={() => {
                  if (task.checked) return;
                  handleToggleTaskClick(task);
                }}
              >
                {/* Checkbox */}
                <div className={`w-6 h-6 shrink-0 rounded flex items-center justify-center border-2 transition-colors mt-0.5 sm:mt-0 ${task.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {task.checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                </div>
                
                {/* Görev Başlığı ve Detayı */}
                <div>
                  <h3 className={`text-base font-bold transition-colors ${task.checked ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-blue-600'}`}>
                    {task.title}
                  </h3>
                  {task.content && (
                    <p className={`text-sm mt-1 line-clamp-2 ${task.checked ? 'text-slate-400' : 'text-slate-500'}`}>
                      {task.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Sağ Alan: İncele Butonu vb. */}
              <div className="flex items-center gap-3 shrink-0 mt-4 sm:mt-0 pl-10 sm:pl-0">
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
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0 ml-10 sm:ml-4">
                <div className="flex items-center gap-2">
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
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.checked ? 'bg-blue-50 text-blue-600' : (task.status === 'Gecikti' ? 'bg-red-100 text-red-500' : 'bg-slate-200 text-slate-600')}`}>
                    {task.status}
                  </span>
                </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'Süresiz'}</span>
                </div>
              </div>
            </div>
          ))
        )}
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
    </div>
  );
}

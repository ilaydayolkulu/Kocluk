import React, { useState, useEffect } from "react";

export default function PlannedTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggleTask = async (taskId, currentChecked) => {
    const newStatus = currentChecked ? 'PENDING' : 'COMPLETED';
    
    // 1. Optimistic Update (Ekranı anında güncelle)
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          checked: !currentChecked, 
          status: !currentChecked ? 'Tamamlandı' : 'Bekliyor' 
        };
      }
      return task;
    }));

    // 2. Backend'e gönder
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/assignments/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
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
                className="flex items-start sm:items-center gap-4 cursor-pointer select-none flex-1"
                onClick={() => handleToggleTask(task.id, task.checked)}
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

              {/* Durum Rozeti ve Tarih */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0 ml-10 sm:ml-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${task.checked ? 'bg-blue-50 text-blue-600' : (task.status === 'Gecikti' ? 'bg-red-100 text-red-500' : 'bg-slate-200 text-slate-600')}`}>
                  {task.status}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'Süresiz'}</span>
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}

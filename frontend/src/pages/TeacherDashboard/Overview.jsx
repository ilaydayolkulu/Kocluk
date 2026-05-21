import React, { useState, useEffect } from "react";

export default function TeacherDashboardHome() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStudent, setFilterStudent] = useState('Tümü');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, title: '', description: '', dueDate: '' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([
      fetch("http://localhost:5000/api/teacher/stats", { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()),
      fetch("http://localhost:5000/api/assignments/all", { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([statsData, tasksData]) => {
      if (statsData) {
        setStats({
          activeStudents: statsData.activeStudents || 0,
          completedTasks: statsData.completedTasks || 0,
          pendingTasks: statsData.pendingTasks || 0
        });
      }
      if (Array.isArray(tasksData)) {
        setAllTasks(tasksData);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Veriler çekilemedi", err);
      setLoading(false);
    });
  }, []);

  const uniqueStudents = ['Tümü', ...new Set(allTasks.map(task => task.student?.name).filter(Boolean))];
  const filteredTasks = filterStudent === 'Tümü' 
    ? allTasks 
    : allTasks.filter(task => task.student?.name === filterStudent);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu ödevi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/assignments/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAllTasks(allTasks.filter(t => t.id !== taskId));
      }
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  const openEditModal = (task) => {
    setEditFormData({
      id: task.id,
      title: task.title,
      description: task.content || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/assignments/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          dueDate: editFormData.dueDate || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedObj = data.updatedAssignment;
        setAllTasks(allTasks.map(t => 
          t.id === editFormData.id 
            ? { ...t, title: updatedObj.title, content: updatedObj.content, dueDate: updatedObj.dueDate }
            : t
        ));
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Güncelleme hatası:', err);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Öğretmen Ana Sayfası</h1>
      <p className="text-slate-500">Öğrencilerinizin genel durumunu, yaklaşan randevularınızı ve son bildirimlerinizi buradan takip edebilirsiniz.</p>
      
      {loading ? (
        <div className="mt-8 text-slate-500 font-medium">İstatistikler yükleniyor...</div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <h3 className="text-blue-800 font-semibold mb-2">Aktif Öğrenciler</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.activeStudents}</p>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <h3 className="text-green-800 font-semibold mb-2">Tamamlanan Görevler</h3>
              <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
              <h3 className="text-purple-800 font-semibold mb-2">Bekleyen Değerlendirmeler</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.pendingTasks}</p>
            </div>
          </div>

          {/* Görev Takip Tablosu */}
          <div className="mt-12 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Tüm Öğrenci Görevleri</h2>
                <span className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  Toplam: {filteredTasks.length}
                </span>
              </div>
              
              {/* Öğrenci Filtresi */}
              <select 
                value={filterStudent} 
                onChange={(e) => setFilterStudent(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
              >
                {uniqueStudents.map(studentName => (
                  <option key={studentName} value={studentName}>{studentName}</option>
                ))}
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                    <th className="px-6 py-4 font-medium">Öğrenci Adı</th>
                    <th className="px-6 py-4 font-medium">Görev Başlığı</th>
                    <th className="px-6 py-4 font-medium">Son Teslim</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        Henüz atanmış bir görev bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {task.student?.name || 'Bilinmiyor'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            task.status === 'COMPLETED' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {task.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedTask(task)}
                              title="Detay"
                              className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </button>
                            <button 
                              onClick={() => openEditModal(task)}
                              title="Düzenle"
                              className="text-amber-600 hover:text-amber-800 p-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              title="Sil"
                              className="text-red-600 hover:text-red-800 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detay Modalı */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 pr-4">{selectedTask.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedTask.student?.name || 'Bilinmeyen Öğrenci'}</p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Görev Detayı (Açıklama)</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTask.content || 'Bu görev için bir detay açıklaması girilmemiş.'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Durum</h4>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedTask.status === 'COMPLETED' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedTask.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {selectedTask.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Son Teslim</h4>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedTask(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Görevi Düzenle</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Görev Başlığı</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Açıklama (Detay)</label>
                  <textarea 
                    rows="3"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Son Teslim Tarihi</label>
                  <input 
                    type="date" 
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 border border-transparent text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

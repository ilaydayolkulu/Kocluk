import React, { useState, useEffect } from "react";

export default function TeacherDashboardHome() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [allTasks, setAllTasks] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Yeni State Mekanizması
  const [selectedDepartment, setSelectedDepartment] = useState('TÜMÜ');
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAssignedStudents, setShowOnlyAssignedStudents] = useState(false);
  const [showAllTasksForDept, setShowAllTasksForDept] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, title: '', description: '', dueDate: '' });

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([
      fetch("http://localhost:5000/api/teacher/stats", { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()),
      fetch("http://localhost:5000/api/assignments/all", { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json()),
      fetch("http://localhost:5000/api/students", { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json())
    ])
    .then(([statsData, tasksData, studentsData]) => {
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
      if (Array.isArray(studentsData)) {
        setAllStudents(studentsData);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Veriler çekilemedi", err);
      setLoading(false);
    });
  }, []);

  const filteredStudents = allStudents.filter(s => {
    const matchDept = selectedDepartment === 'TÜMÜ' || s.department === selectedDepartment;
    const matchName = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchName;
  });

  // Filtre değiştiğinde veya data geldiğinde ilk öğrenciyi otomatik seç
  useEffect(() => {
    if (showAllTasksForDept) return; // Tüm görevler modundaysak seçimi zorlama
    
    if (filteredStudents.length > 0) {
      const isCurrentActiveStillVisible = filteredStudents.some(s => s.id === activeStudentId);
      if (!isCurrentActiveStillVisible) {
        setActiveStudentId(filteredStudents[0].id);
      }
    } else {
      setActiveStudentId(null);
    }
  }, [filteredStudents, activeStudentId, showAllTasksForDept]);

  const activeStudentTasks = allTasks
    .filter(task => task.studentId === activeStudentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const activeStudent = allStudents.find(s => s.id === activeStudentId);

  // Dinamik Alan Sayacı (KPI Metriği)
  const activeStudentsInDeptCount = filteredStudents.filter(student => 
    allTasks.some(task => task.studentId === student.id)
  ).length;

  const getDeptName = (dept) => {
    switch(dept) {
      case 'SAY': return 'Sayısal (SAY)';
      case 'EA': return 'Eşit Ağırlık (EA)';
      case 'SÖZ': return 'Sözel (SÖZ)';
      case 'DİL': return 'Yabancı Dil (DİL)';
      default: return 'Tüm alanlarda';
    }
  };

  const dynamicCounterText = `${getDeptName(selectedDepartment)} ${selectedDepartment === 'TÜMÜ' ? 'toplam' : 'alanında toplam'} ${activeStudentsInDeptCount} öğrenciye aktif görev tanımlanmış.`;

  // Yeni Görünüm Filtreleri
  const displayedStudents = showOnlyAssignedStudents 
    ? filteredStudents.filter(student => allTasks.some(task => task.studentId === student.id))
    : filteredStudents;

  const deptTasks = allTasks.filter(task => {
    const student = allStudents.find(s => s.id === task.studentId);
    return student && (selectedDepartment === 'TÜMÜ' || student.department === selectedDepartment);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

          {/* İNTERAKTİF GÖREV İZLEME MOTORU */}
          <div className="mt-12">
            <div className="flex flex-col mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">İnteraktif Görev İzleme Motoru</h2>
                  <p className="text-sm text-slate-500 mt-1">Öğrencilerinizi alanlarına göre filtreleyin ve görevlerini anlık takip edin.</p>
                </div>
                
                {/* Alan Filtre Butonları */}
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                  {['TÜMÜ', 'SAY', 'EA', 'SÖZ', 'DİL'].map(dept => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartment(dept)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 ${selectedDepartment === dept ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 self-start">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {dynamicCounterText}
              </div>
              
              {/* Yeni Görünüm Seçenekleri */}
              <div className="flex flex-wrap gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showOnlyAssignedStudents} 
                    onChange={() => setShowOnlyAssignedStudents(!showOnlyAssignedStudents)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-slate-700">Sadece Görev Atananları Göster</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showAllTasksForDept} 
                    onChange={() => {
                      setShowAllTasksForDept(!showAllTasksForDept);
                      if (!showAllTasksForDept) setActiveStudentId(null);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-slate-700">Seçili Alandaki Tüm Görevleri Listele</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
              {/* Sol Panel: Öğrenci Süzgeç Listesi */}
              <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full max-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Öğrenciler ({displayedStudents.length})</h3>
                  <div className="relative">
                    <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input 
                      type="text"
                      placeholder="İsimle ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1">
                  {displayedStudents.length === 0 ? (
                    <p className="text-sm text-slate-500 p-4 text-center">Öğrenci bulunmuyor.</p>
                  ) : (
                    displayedStudents.map(student => {
                      const studentTaskCount = allTasks.filter(t => t.studentId === student.id).length;
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            setActiveStudentId(student.id);
                            setShowAllTasksForDept(false); // Öğrenciye tıklanınca toplu görünümü kapat
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between border-l-4 ${
                            activeStudentId === student.id && !showAllTasksForDept
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className={`block font-medium ${activeStudentId === student.id ? 'text-blue-800' : 'text-slate-700'}`}>{student.name}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{student.department || 'Bilinmiyor'} • {studentTaskCount} Görev</span>
                          </div>
                          <svg className={`w-4 h-4 shrink-0 ${activeStudentId === student.id ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sağ Panel: Öğrenciye Ait veya Alana Ait Görevler */}
              <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col h-full max-h-[600px] overflow-y-auto">
                {showAllTasksForDept ? (
                  <>
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{getDeptName(selectedDepartment)} - Tüm Görevler</h3>
                        <p className="text-sm text-slate-500 mt-1">Seçili alandaki öğrencilere atanan tüm görevler</p>
                      </div>
                      <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm shrink-0">
                        Toplam Görev: {deptTasks.length}
                      </span>
                    </div>

                    {deptTasks.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 border-dashed rounded-3xl p-12">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 mb-2">Görev Bulunamadı</h3>
                          <p className="text-slate-500 max-w-sm mx-auto">Bu alanda henüz hiçbir öğrenciye görev tanımlanmamış.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deptTasks.map(task => (
                          <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5 justify-between sm:items-start">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-800 text-lg">{task.title}</h4>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  task.status === 'COMPLETED' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                  {task.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                                </span>
                              </div>
                              <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg mb-2">
                                Öğrenci: {task.student?.name || 'Bilinmeyen'}
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2 mt-1">{task.content}</p>
                              
                              {task.status === 'COMPLETED' && (task.studentNote || task.submittedFileUrl) && (
                                <div className="mt-4 flex flex-col items-start gap-3">
                                  {task.studentNote && (
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5 w-full max-w-2xl">
                                      <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                      <p className="text-sm text-slate-600 italic">"{task.studentNote}"</p>
                                    </div>
                                  )}
                                  {task.submittedFileUrl && (
                                    <a 
                                      href={`http://localhost:5000${task.submittedFileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-purple-200 transition-colors w-fit"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                      Öğrenci Çözümünü Gör
                                    </a>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                  Son Teslim: <span className="text-slate-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmedi'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:flex-col shrink-0 mt-4 sm:mt-0">
                              <button onClick={() => setSelectedTask(task)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Detay">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              </button>
                              <button onClick={() => openEditModal(task)} className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Düzenle">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Sil">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : activeStudent ? (
                  <>
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{activeStudent.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">Öğrenciye ait güncel görev kartları</p>
                      </div>
                      <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm shrink-0">
                        Toplam Görev: {activeStudentTasks.length}
                      </span>
                    </div>

                    {activeStudentTasks.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center bg-white border border-slate-200 border-dashed rounded-3xl p-12">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          </div>
                          <h3 className="text-lg font-bold text-slate-700 mb-2">Görev Bulunamadı</h3>
                          <p className="text-slate-500 max-w-sm mx-auto">Bu öğrenciye henüz bir görev tanımlanmamış. Sol menüden görev atama sayfasına gidebilirsiniz.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeStudentTasks.map(task => (
                          <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5 justify-between sm:items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-slate-800 text-lg">{task.title}</h4>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  task.status === 'COMPLETED' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                  {task.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2 mt-2">{task.content}</p>
                              
                              {task.status === 'COMPLETED' && (task.studentNote || task.submittedFileUrl) && (
                                <div className="mt-4 flex flex-col items-start gap-3">
                                  {task.studentNote && (
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2.5 w-full max-w-2xl">
                                      <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                      <p className="text-sm text-slate-600 italic">"{task.studentNote}"</p>
                                    </div>
                                  )}
                                  {task.submittedFileUrl && (
                                    <a 
                                      href={`http://localhost:5000${task.submittedFileUrl}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-purple-200 transition-colors w-fit"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                      Öğrenci Çözümünü Gör
                                    </a>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                  Son Teslim: <span className="text-slate-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belirtilmedi'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* İşlem Butonları */}
                            <div className="flex items-center gap-2 sm:flex-col shrink-0 mt-4 sm:mt-0">
                              <button onClick={() => setSelectedTask(task)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Detay">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              </button>
                              <button onClick={() => openEditModal(task)} className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Düzenle">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors w-full sm:w-auto flex justify-center" title="Sil">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                    </div>
                    <p className="text-slate-500 font-medium text-lg">Lütfen görevlerini incelemek istediğiniz bir öğrenci seçin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detay Modalı */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800 pr-4">{selectedTask.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedTask.student?.name || activeStudent?.name || 'Bilinmeyen Öğrenci'}</p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Görev Detayı (Açıklama)</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTask.content || 'Bu görev için bir detay açıklaması girilmemiş.'}
                </div>
                {selectedTask.studentNote && (
                  <div className="mt-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                      Öğrencinin Teslim Notu
                    </h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                      "{selectedTask.studentNote}"
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
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
                  {selectedTask.fileUrl && (
                    <div className="mt-4">
                      <a 
                        href={`http://localhost:5000${selectedTask.fileUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                        Öğretmen Eki
                      </a>
                    </div>
                  )}
                  {selectedTask.status === 'COMPLETED' && selectedTask.submittedFileUrl && (
                    <div className="mt-3">
                      <a 
                        href={`http://localhost:5000${selectedTask.submittedFileUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition border border-purple-200"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Öğrenci Eki
                      </a>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Son Teslim</h4>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
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
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Görevi Düzenle</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200 transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
              
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
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

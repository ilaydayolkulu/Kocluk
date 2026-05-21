import React, { useState, useEffect } from "react";

export default function AssignTasksPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    studentId: "",
    title: "",
    description: "",
    dueDate: ""
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/students", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, studentId: data[0].id.toString() }));
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Öğrenciler yüklenemedi", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    
    if (!formData.studentId || !formData.title || !formData.description) {
      setErrorMsg("Lütfen öğrenci, başlık ve görev detayını doldurun.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          title: formData.title,
          description: formData.description,
          dueDate: formData.dueDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Görev atanamadı.");
      }

      setSuccessMsg("Görev başarıyla atandı!");
      setFormData(prev => ({
        ...prev,
        title: "",
        description: "",
        dueDate: ""
      }));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Öğrenciye Görev Ver</h1>
      <p className="text-slate-500 mb-8">Öğrencilerinize günlük, haftalık veya aylık periyotlarla çalışma görevleri atayın.</p>
      
      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium">
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form className="space-y-6 max-w-2xl" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Öğrenci Seçin</label>
          <select 
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? (
              <option value="">Yükleniyor...</option>
            ) : (
              students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Görev Başlığı</label>
          <input 
            type="text" 
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Örn: TYT Matematik - Üslü Sayılar 50 Soru" 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Görev Detayı (Açıklama)</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ödevin detaylarını buraya yazın..." 
            rows="3"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Son Teslim Tarihi</label>
            <input 
              type="date" 
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Öncelik</label>
            <select className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500">
              <option>Normal</option>
              <option>Yüksek</option>
              <option>Düşük</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="bg-[#2563EB] text-white font-medium rounded-xl px-6 py-3 hover:bg-blue-700 transition disabled:opacity-70"
        >
          {submitting ? 'Atanıyor...' : 'Görevi Ata'}
        </button>
      </form>
    </div>
  );
}

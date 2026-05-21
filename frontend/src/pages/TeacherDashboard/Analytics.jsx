import React, { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

// Renk paleti
const COLORS = {
  dogru: "#22c55e",
  yanlis: "#ef4444",
  bos: "#cbd5e1"
};

// Tekrar kullanılabilir Deneme Sınavı Kartı Bileşeni
function ExamCard({ title, totalQuestions, data, breakdown }) {
  const dogru = data.find(d => d.name === "Doğru")?.value || 0;
  const yanlis = data.find(d => d.name === "Yanlış")?.value || 0;
  const bos = data.find(d => d.name === "Boş")?.value || 0;
  const net = dogru - (yanlis * 0.25);
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <h2 className="text-xl font-bold text-slate-800 mb-1">{title}</h2>
      <p className="text-sm text-slate-500 mb-6">Toplam {totalQuestions} Soru</p>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        <div className="w-40 h-40 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={COLORS.dogru} />
                <Cell fill={COLORS.yanlis} />
                <Cell fill={COLORS.bos} />
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{net.toFixed(2)}</span>
            <span className="text-xs text-slate-500 font-medium">Net</span>
          </div>
        </div>
        
        <div className="flex flex-col justify-center space-y-3 w-full md:pl-4">
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-green-500"></div>
               <span className="text-slate-600 font-medium">Doğru</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{dogru}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500"></div>
               <span className="text-slate-600 font-medium">Yanlış</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{yanlis}</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-slate-300"></div>
               <span className="text-slate-600 font-medium">Boş</span>
             </div>
             <span className="font-bold text-slate-800 text-base">{bos}</span>
           </div>
        </div>
      </div>
      
      <div className="border-t border-slate-100 pt-5 mt-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ders Dağılımı</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          {breakdown.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1">{item.subject} <span className="text-slate-400">({item.total})</span></span>
              <div className="flex gap-2 items-baseline">
                <span className="text-sm font-semibold text-green-600">{item.d}D</span>
                <span className="text-sm font-semibold text-red-500">{item.y}Y</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [examTab, setExamTab] = useState("TYT");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) {
            setSelectedStudent(data[0].id.toString());
          } else {
            setLoading(false);
          }
        }
      })
      .catch(err => {
        console.error("API hatası (öğrenciler):", err);
        setError("Öğrenciler yüklenemedi.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    
    setLoading(true);
    fetch(`http://localhost:5000/api/exams/student/${selectedStudent}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExams(data);
        } else {
          setExams([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("API hatası (sınavlar):", err);
        setError("Sınav verileri yüklenemedi.");
        setLoading(false);
      });
  }, [selectedStudent]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Veriler yükleniyor...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  // Dinamik Trend Datası
  const parsedTrendData = exams.map(exam => {
    const d = new Date(exam.createdAt);
    const dateStr = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    return { date: dateStr, examType: exam.examType, net: exam.totalNet };
  });
  const activeTrendData = parsedTrendData.filter(d => d.examType === examTab);

  // TYT Örnek Hesaplama
  const lastTyt = exams.filter(e => e.examType === 'TYT').pop();
  const tytData = lastTyt ? [
    { name: "Doğru", value: Math.floor(lastTyt.totalNet) }, 
    { name: "Yanlış", value: Math.floor((120 - lastTyt.totalNet) * 0.2) }, 
    { name: "Boş", value: 120 - Math.floor(lastTyt.totalNet) - Math.floor((120 - lastTyt.totalNet) * 0.2) }
  ] : [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 120 } ];
  
  const tytBreakdown = lastTyt ? [
    { subject: "Türkçe", total: 40, d: lastTyt.tytTurkish, y: 0 },
    { subject: "Matematik", total: 40, d: lastTyt.tytMath, y: 0 },
    { subject: "Fen Bilimleri", total: 20, d: lastTyt.tytScience, y: 0 },
    { subject: "Sosyal Bilgiler", total: 20, d: lastTyt.tytSocial, y: 0 }
  ] : [];

  // AYT Hesaplama
  const lastAyt = exams.filter(e => e.examType === 'AYT').pop();
  const aytSayData = lastAyt ? [
    { name: "Doğru", value: Math.floor(lastAyt.totalNet) },
    { name: "Yanlış", value: 0 },
    { name: "Boş", value: 80 - Math.floor(lastAyt.totalNet) }
  ] : [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 80 } ];
  
  const aytSayBreakdown = lastAyt ? [
    { subject: "Matematik", total: 40, d: lastAyt.aytMath, y: 0 },
    { subject: "Fen Bilimleri", total: 40, d: lastAyt.aytScience, y: 0 }
  ] : [];

  const aytEaData = [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 80 } ];
  const aytEaBreakdown = [];
  const aytSozData = [ { name: "Doğru", value: 0 }, { name: "Yanlış", value: 0 }, { name: "Boş", value: 80 } ];
  const aytSozBreakdown = [];

  return (
    <div className="min-h-full pb-12">
      
      {/* Üst Kısım ve Öğrenci Seçici */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Öğrenci Analizleri</h1>
          <p className="text-slate-500 mt-2">Öğrencilerinizin deneme performanslarını ve detaylı analizlerini inceleyin.</p>
        </div>
        
        <div className="flex flex-col gap-1.5 shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Öğrenci Seçin</label>
          <select 
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#2563EB] text-sm font-bold text-[#2563EB] cursor-pointer min-w-[200px]"
          >
            {students.map(student => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {exams.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium">Bu öğrenciye ait deneme sınavı verisi bulunamadı.</p>
        </div>
      ) : (
        <>
          {/* Çark Kartları (Pie Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExamCard title="TYT Deneme Sınavı" totalQuestions={120} data={tytData} breakdown={tytBreakdown} />
            <ExamCard title="AYT (Sayısal) Deneme Sınavı" totalQuestions={80} data={aytSayData} breakdown={aytSayBreakdown} />
            <ExamCard title="AYT (Eşit Ağırlık) Deneme Sınavı" totalQuestions={80} data={aytEaData} breakdown={aytEaBreakdown} />
            <ExamCard title="AYT (Sözel) Deneme Sınavı" totalQuestions={80} data={aytSozData} breakdown={aytSozBreakdown} />
          </div>

          {/* Genel İlerleme Grafiği (Line Chart) */}
          <div className="mt-12 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dönemsel Net İlerlemesi</h2>
                <p className="text-sm text-slate-500 mt-1">Öğrencinin girdiği denemelerin tarihsel olarak net (doğru-yanlış) gelişimi.</p>
              </div>
              
              {/* Filtre ve Sekme Butonları */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                  <button 
                    onClick={() => setExamTab("TYT")} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${examTab === 'TYT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    TYT
                  </button>
                  <button 
                    onClick={() => setExamTab("AYT")} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${examTab === 'AYT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    AYT
                  </button>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                  <button 
                    onClick={() => setTimeFilter("all")} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Tüm Dönem
                  </button>
                  <button 
                    onClick={() => setTimeFilter("month")} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeFilter === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Aylık
                  </button>
                  <button 
                    onClick={() => setTimeFilter("week")} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeFilter === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Haftalık
                  </button>
                </div>
              </div>
            </div>

            {/* Çizgi Grafiği */}
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                    dy={10} 
                  />
                  <YAxis 
                    domain={[0, 120]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                  
                  <Line 
                    name={`${examTab} Neti`} 
                    type="monotone" 
                    dataKey="net" 
                    stroke={examTab === "TYT" ? "#3b82f6" : "#8b5cf6"} 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: examTab === "TYT" ? "#3b82f6" : "#8b5cf6" }} 
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


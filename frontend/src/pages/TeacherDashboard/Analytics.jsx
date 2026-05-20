import React, { useState } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

// Renk paleti
const COLORS = {
  dogru: "#22c55e", // Yeşil
  yanlis: "#ef4444", // Kırmızı
  bos: "#cbd5e1"     // Gri/Slate
};

// Çizgi Grafik (Trend) için Örnek Veriler
const trendData = {
  all: [
    { date: "15 Eyl", tyt: 55, ayt: 35 },
    { date: "10 Eki", tyt: 62, ayt: 42 },
    { date: "05 Kas", tyt: 68, ayt: 48 },
    { date: "25 Kas", tyt: 75, ayt: 55 },
    { date: "15 Ara", tyt: 82, ayt: 58 },
    { date: "05 Oca", tyt: 90, ayt: 62 },
  ],
  month: [
    { date: "1 Oca", tyt: 82, ayt: 58 },
    { date: "10 Oca", tyt: 85, ayt: 60 },
    { date: "20 Oca", tyt: 88, ayt: 61 },
    { date: "30 Oca", tyt: 90, ayt: 62 },
  ],
  week: [
    { date: "Pzt", tyt: 88, ayt: 60 },
    { date: "Çar", tyt: 89, ayt: 61 },
    { date: "Cum", tyt: 90, ayt: 62 },
  ]
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
  const [selectedStudent, setSelectedStudent] = useState("Ahmet Yılmaz");
  const [timeFilter, setTimeFilter] = useState("all");
  
  // Seçilen öğrenciye göre farklı data getirilebilir (şimdilik statik mock data)
  const activeTrendData = trendData[timeFilter];

  // TYT Örnek Verileri
  const tytData = [ { name: "Doğru", value: 93 }, { name: "Yanlış", value: 10 }, { name: "Boş", value: 17 } ];
  const tytBreakdown = [
    { subject: "Türkçe", total: 40, d: 32, y: 4 },
    { subject: "Matematik", total: 40, d: 28, y: 2 },
    { subject: "Fen Bilimleri", total: 20, d: 15, y: 3 },
    { subject: "Sosyal Bilgiler", total: 20, d: 18, y: 1 }
  ];

  // AYT Sayısal Örnek Verileri
  const aytSayData = [ { name: "Doğru", value: 62 }, { name: "Yanlış", value: 8 }, { name: "Boş", value: 10 } ];
  const aytSayBreakdown = [
    { subject: "Matematik", total: 40, d: 30, y: 3 },
    { subject: "Fen Bilimleri", total: 40, d: 32, y: 5 }
  ];

  // AYT Eşit Ağırlık Örnek Verileri
  const aytEaData = [ { name: "Doğru", value: 55 }, { name: "Yanlış", value: 11 }, { name: "Boş", value: 14 } ];
  const aytEaBreakdown = [
    { subject: "Matematik", total: 40, d: 25, y: 5 },
    { subject: "Edebiyat-Sosyal 1", total: 40, d: 30, y: 6 }
  ];

  // AYT Sözel Örnek Verileri
  const aytSozData = [ { name: "Doğru", value: 67 }, { name: "Yanlış", value: 9 }, { name: "Boş", value: 4 } ];
  const aytSozBreakdown = [
    { subject: "Edebiyat-Sosyal 1", total: 40, d: 35, y: 3 },
    { subject: "Sosyal 2", total: 40, d: 32, y: 6 }
  ];

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
            <option>Ahmet Yılmaz</option>
            <option>Zeynep Kaya</option>
            <option>Caner Çelik</option>
          </select>
        </div>
      </div>
      
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
            <h2 className="text-xl font-bold text-slate-800">{selectedStudent} - Dönemsel Net İlerlemesi</h2>
            <p className="text-sm text-slate-500 mt-1">Öğrencinin girdiği denemelerin tarihsel olarak net (doğru-yanlış) gelişimi.</p>
          </div>
          
          {/* Zaman Filtre Butonları */}
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
                name="TYT Neti" 
                type="monotone" 
                dataKey="tyt" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }} 
                activeDot={{ r: 7 }} 
              />
              <Line 
                name="AYT Neti" 
                type="monotone" 
                dataKey="ayt" 
                stroke="#8b5cf6" 
                strokeWidth={4} 
                dot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#8b5cf6" }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React from "react";

export default function PlannedTasksPage() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Planlanan Görevler</h1>
        
        {/* Hafta / Ay geçişi için örnek bir toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button className="px-4 py-1.5 bg-white shadow-sm rounded text-sm font-medium text-slate-800">Haftalık</button>
          <button className="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">Aylık</button>
        </div>
      </div>
      
      <p className="text-slate-500">Haftalık ve aylık bazda planlanan görevleriniz burada gösterilecek.</p>
      
      {/* İleride buraya Takvim veya Haftalık Liste bileşeni gelecek */}
    </div>
  );
}

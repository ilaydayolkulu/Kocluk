import React from "react";

export default function DailyTasksPage() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Günlük Görevler</h1>
      <p className="text-slate-500">Bugün yapmanız gereken görevler burada listelenecek.</p>
      
      {/* İleride buraya günlük görev listesi (Checklist) bileşeni gelecek */}
    </div>
  );
}

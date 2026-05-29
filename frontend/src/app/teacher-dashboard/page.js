"use client";
import React from "react";

export default function TeacherDashboardHome() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Öğretmen Ana Sayfası</h1>
      <p className="text-slate-500">Öğrencilerinizin genel durumunu, yaklaşan randevularınızı ve son bildirimlerinizi buradan takip edebilirsiniz.</p>
      
      {/* İleride buraya öğretmen için özet istatistikler ve bildirimler eklenecek */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <h3 className="text-blue-800 font-semibold mb-2">Aktif Öğrenciler</h3>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
          <h3 className="text-green-800 font-semibold mb-2">Tamamlanan Görevler</h3>
          <p className="text-3xl font-bold text-green-600">156</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
          <h3 className="text-purple-800 font-semibold mb-2">Bekleyen Değerlendirmeler</h3>
          <p className="text-3xl font-bold text-purple-600">8</p>
        </div>
      </div>
    </div>
  );
}

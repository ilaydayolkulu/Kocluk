"use client";
import React from "react";

export default function AssignTasksPage() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Öğrenciye Görev Ver</h1>
      <p className="text-slate-500 mb-8">Öğrencilerinize günlük, haftalık veya aylık periyotlarla çalışma görevleri atayın.</p>
      
      {/* Basit bir Görev Atama Formu Taslağı */}
      <form className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Öğrenci Seçin</label>
          <select className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500">
            <option>Ahmet Yılmaz</option>
            <option>Zeynep Kaya</option>
            <option>Caner Çelik</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Görev Başlığı</label>
          <input 
            type="text" 
            placeholder="Örn: TYT Matematik - Üslü Sayılar 50 Soru" 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Son Teslim Tarihi</label>
            <input 
              type="date" 
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
          type="button" 
          className="bg-[#2563EB] text-white font-medium rounded-xl px-6 py-3 hover:bg-blue-700 transition"
        >
          Görevi Ata
        </button>
      </form>
    </div>
  );
}

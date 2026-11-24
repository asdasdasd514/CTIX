import React from 'react';
import { Outlet } from 'react-router-dom';
import { CitizenTopNav } from '../components/Navigation/CitizenTopNav';
import { useIncidentStore } from '../store/useIncidentStore';
import { MapPin, Phone, ShieldCheck } from 'lucide-react';

export const CitizenLayout: React.FC = () => {
  const { elderlyMode } = useIncidentStore();

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans ${
        elderlyMode ? 'elderly-mode' : ''
      }`}
    >
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP NAVIGATION) CHO CÔNG DÂN */}
      <CitizenTopNav />

      {/* 2. NỘI DUNG CHÍNH RỘNG RÃI (KHÔNG CÓ SIDEBAR BÊN TRÁI) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* 3. FOOTER DÂN SINH MINH BẠCH */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-bold text-slate-700 block">
                Cổng Dịch Vụ Tiếp Nhận Phản Ánh Hiện Trường Đô Thị Thông Minh
              </span>
              <span className="text-[11px] text-slate-400">
                Ủy Ban Nhân Dân Phường Trấn Biên • TP. Biên Hòa, Tỉnh Đồng Nai
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Số 128 Đường Nguyễn Ái Quốc, KP.2</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-blue-700">
              <Phone className="w-3.5 h-3.5" />
              <span>Đường dây nóng: 1022 hoặc (0251) 3822.xxx</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

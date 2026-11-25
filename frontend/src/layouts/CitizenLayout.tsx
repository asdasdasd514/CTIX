import React from 'react';
import { Outlet } from 'react-router-dom';
import { CitizenTopNav } from '../components/Navigation/CitizenTopNav';
import { CitizenAiAssistant } from '../components/Citizen/CitizenAiAssistant';
import { useIncidentStore } from '../store/useIncidentStore';
import { MapPin, Phone, ShieldCheck } from 'lucide-react';

export const CitizenLayout: React.FC = () => {
  const { elderlyMode } = useIncidentStore();

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-800 flex flex-col font-sans pb-[76px] md:pb-0 ${
        elderlyMode ? 'elderly-mode' : ''
      }`}
    >
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (PC) & THANH MENU DƯỚI CÙNG (MOBILE) */}
      <CitizenTopNav />

      {/* 2. NỘI DUNG CHÍNH CĂN ĐỀU RỘNG RÃI CHUẨN PC & ĐIỆN THOẠI */}
      <main className="flex-1 w-full max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        <Outlet />
      </main>

      {/* 3. FOOTER DÂN SINH MINH BẠCH */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 sm:py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-[1536px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[5px] overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <img
                src="/images/ctix-logo.jpg"
                alt="Trấn Biên SmartCity"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 block leading-snug">
                Cổng Dịch Vụ Tiếp Nhận Phản Ánh Hiện Trường Đô Thị
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Ủy Ban Nhân Dân Phường Trấn Biên • TP. Biên Hòa, Tỉnh Đồng Nai
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-5 text-[11px] border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Số 128 Đường Nguyễn Ái Quốc, KP.2</span>
            </span>
            <a
              href="tel:1022"
              className="flex items-center gap-1.5 font-bold text-blue-700 hover:underline whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>Đường dây nóng: 1022</span>
            </a>
          </div>
        </div>
      </footer>
      {/* 4. TRỢ LÝ AI NỔI (CHẠM = CHATBOT | GIỮ 1S = RA LỆNH GIỌNG NÓI) */}
      <CitizenAiAssistant />
    </div>
  );
};

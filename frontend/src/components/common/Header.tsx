import React from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { UserRole } from '../../types/incident';
import { ShieldCheck, User, Users, Eye, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentRole, setCurrentRole, elderlyMode, toggleElderlyMode, resetToDefaultData, incidents } = useIncidentStore();

  const totalIncidents = incidents.length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  return (
    <header className="sticky top-0 z-50 bg-[#0f3b7d] text-white shadow-md">
      {/* Top Bar: Thương hiệu chính quyền & Trợ năng */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg text-amber-400 shadow-inner">
            TB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200 bg-blue-900/80 px-2 py-0.5 rounded">
                Chính quyền số Đô thị thông minh
              </span>
              <span className="hidden sm:inline-block text-[11px] text-emerald-300 font-medium">
                • {resolvedCount}/{totalIncidents} đã xử lý
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold leading-tight">
              UBND Phường Trấn Biên – Cổng Phản Ánh Hiện Trường
            </h1>
          </div>
        </div>

        {/* Nút trợ năng & Reset dữ liệu */}
        <div className="flex items-center gap-2">
          {/* Nút Chế độ người cao tuổi */}
          <button
            onClick={toggleElderlyMode}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              elderlyMode
                ? 'bg-amber-400 text-slate-900 border-amber-300 ring-2 ring-amber-300 font-bold'
                : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
            }`}
            title="Bật/Tắt chữ lớn và giao diện tương phản cao cho người lớn tuổi"
          >
            <Eye className="w-4 h-4" />
            <span>{elderlyMode ? '✓ Đang bật Chữ Lớn' : '👓 Chữ Lớn (Người già)'}</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('Khôi phục lại dữ liệu gốc 64 phản ánh chuẩn của Phường Trấn Biên?')) {
                resetToDefaultData();
              }
            }}
            type="button"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition"
            title="Khôi phục lại 64 dữ liệu mẫu ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Navigation Bar: Chuyển đổi nhanh 3 vai trò */}
      <div className="bg-[#0b2d61] px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2">
          <div className="text-xs text-blue-200 font-medium whitespace-nowrap hidden md:block">
            Đang xem với vai trò:
          </div>
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setCurrentRole('citizen')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                currentRole === 'citizen'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>(1) Người dân</span>
            </button>

            <button
              onClick={() => setCurrentRole('officer')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                currentRole === 'officer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>(2) Cán bộ Phường</span>
            </button>

            <button
              onClick={() => setCurrentRole('volunteer')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition ${
                currentRole === 'volunteer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>(3) Đội Thanh niên</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

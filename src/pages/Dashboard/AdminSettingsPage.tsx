import React from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Building2, Eye, RotateCcw, ShieldCheck, Clock } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { elderlyMode, toggleElderlyMode, resetToDefaultData, incidents } = useIncidentStore();
  const { currentUser } = useAuthStore();

  const handleResetDemo = () => {
    if (
      window.confirm(
        'Khôi phục 64 hồ sơ mẫu Phường Trấn Biên? Các thay đổi demo hiện tại sẽ được đặt lại.'
      )
    ) {
      resetToDefaultData();
      alert('Đã khôi phục thành công 64 hồ sơ mẫu!');
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
          Cài Đặt Hệ Thống Quản Trị
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Quản lý cấu hình hiển thị, thông tin đơn vị và dữ liệu vận hành UBND Phường Trấn Biên
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Thông tin đơn vị */}
        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Thông tin đơn vị vận hành</span>
          </h3>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between gap-2 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Đơn vị tiếp nhận:</span>
              <strong className="text-slate-900 text-right">UBND Phường Trấn Biên</strong>
            </div>
            <div className="flex justify-between gap-2 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Cán bộ đang đăng nhập:</span>
              <strong className="text-slate-900 text-right">{currentUser.name}</strong>
            </div>
            <div className="flex justify-between gap-2 py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email công vụ:</span>
              <strong className="text-slate-900 text-right">{currentUser.email}</strong>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <span className="text-slate-500 font-medium">Tổng hồ sơ hiện có:</span>
              <strong className="text-blue-700 text-right">{incidents.length} hồ sơ</strong>
            </div>
          </div>
        </div>

        {/* Cam kết SLA & Giao diện */}
        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-emerald-600 shadow-sm p-5 space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tùy chỉnh hiển thị & Dữ liệu</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Chế độ chữ lớn (Trợ năng)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Phóng to cỡ chữ và tăng độ tương phản trên toàn hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={toggleElderlyMode}
                className={`px-3.5 py-2 rounded-[5px] text-xs font-bold border transition shrink-0 ${
                  elderlyMode
                    ? 'bg-amber-400 text-slate-950 border-amber-500'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {elderlyMode ? 'Đang bật' : 'Đang tắt'}
              </button>
            </div>

            <div className="p-3.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Định mức thời gian xử lý (SLA)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tiếp nhận trong 2h • Hoàn thành tiêu chuẩn 24h – 48h
                </p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[5px] border border-emerald-200 shrink-0">
                Đang áp dụng
              </span>
            </div>

            <div className="p-3.5 rounded-[5px] bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-rose-900 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Khôi phục dữ liệu mẫu</span>
                </div>
                <p className="text-[11px] text-rose-800/80 mt-0.5">
                  Đặt lại 64 phản ánh chuẩn Phường Trấn Biên (tháng 11/2026)
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-3.5 py-2 rounded-[5px] bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition shrink-0"
              >
                Khôi phục
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

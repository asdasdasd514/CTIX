import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import {
  Camera,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  Phone,
  ArrowRight,
} from 'lucide-react';

export const CitizenHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, elderlyMode } = useIncidentStore();

  const pendingCount = incidents.filter((i) => i.status === 'pending').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
  const myRecentReports = incidents.slice(0, 3);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. HERO BANNER CHÀO MỪNG (GÓC VUÔNG, CÂN ĐỐI PC & MOBILE) */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-none p-5 sm:p-8 shadow-sm relative overflow-hidden border border-blue-950">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-none text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white border border-white/20">
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse shrink-0" />
            <span>Hệ thống tiếp nhận 24/7 • Phường Trấn Biên</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug">
            Chung tay xây dựng Đô thị Trấn Biên Văn minh - An toàn
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
            Phát hiện đèn đường hỏng, ngập nước, bãi rác tự phát hay ổ gà nguy hiểm? Chụp ảnh và gửi ngay để UBND Phường tiếp nhận xử lý đúng thời hạn cam kết.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/citizen/submit')}
              className={`flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-none shadow-sm transition active:scale-[0.99] border border-amber-500 uppercase tracking-wide ${
                elderlyMode ? 'px-6 py-4 text-base' : 'px-5 py-3 text-xs sm:text-sm'
              }`}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
              <span>Gửi phản ánh mới (2 bước)</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => navigate('/citizen/reports')}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-none border border-white/25 transition text-xs sm:text-sm"
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Xem danh sách phản ánh</span>
            </button>
          </div>
        </div>

        <div className="absolute right-6 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden lg:flex items-center justify-center">
          <Camera className="w-56 h-56 text-white" />
        </div>
      </section>

      {/* 2. THỐNG KÊ NHANH (GÓC VUÔNG, VIỀN NHẤN TRÊN SẮC NÉT) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-none p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-blue-700 shadow-sm">
          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Tổng phản ánh tiếp nhận</div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">12.450</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">● Toàn thành phố</div>
        </div>

        <div className="bg-white rounded-none p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-emerald-600 shadow-sm">
          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Đã khắc phục hoàn thành</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-1">{resolvedCount} sự cố</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Có ảnh nghiệm thu</div>
        </div>

        <div className="bg-white rounded-none p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-amber-500 shadow-sm">
          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Đang khẩn trương xử lý</div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">{pendingCount} sự cố</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Đúng hạn cam kết SLA</div>
        </div>

        <div className="bg-white rounded-none p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-indigo-600 shadow-sm">
          <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Mức độ hài lòng của dân</div>
          <div className="text-lg sm:text-2xl font-black text-blue-700 mt-1">96,8%</div>
          <div className="text-[11px] text-amber-500 font-bold mt-0.5">★★★★★ (4.9/5)</div>
        </div>
      </section>

      {/* 3. THÔNG BÁO KHẨN TỪ UBND PHƯỜNG */}
      <section className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-none p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base text-amber-950 leading-snug">
              Cảnh báo triều cường ngập cục bộ tại một số tuyến đường (11/2026)
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
              UBND Phường Trấn Biên khuyến cáo người dân hạn chế di chuyển qua đoạn đường ven sông Đồng Nai và ngã 3 Tân Mai từ 17h00 - 19h00. Nếu phát hiện cống nghẹt hoặc cây ngã, vui lòng gửi phản ánh ngay.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CÁC DANH MỤC PHẢN ÁNH THƯỜNG GẶP */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Bạn cần phản ánh vấn đề gì?
          </h2>
          <button
            onClick={() => navigate('/citizen/map')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Xem bản đồ sự cố quanh đây</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 sm:p-4 bg-white hover:bg-amber-50/70 rounded-none border border-slate-200 hover:border-amber-400 shadow-sm text-left group transition flex flex-col justify-between min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-amber-100 text-amber-700 flex items-center justify-center mb-3 border border-amber-200 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Đèn Chiếu Sáng</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Bóng cháy, mất điện, chập chờn</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 sm:p-4 bg-white hover:bg-blue-50/70 rounded-none border border-slate-200 hover:border-blue-400 shadow-sm text-left group transition flex flex-col justify-between min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center mb-3 border border-blue-200 shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Ngập Nước Sau Mưa</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Cống nghẹt, đọng nước sâu</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 sm:p-4 bg-white hover:bg-emerald-50/70 rounded-none border border-slate-200 hover:border-emerald-400 shadow-sm text-left group transition flex flex-col justify-between min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-200 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Rác Thải Tự Phát</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Bãi rác trái phép, bốc mùi hôi</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 sm:p-4 bg-white hover:bg-rose-50/70 rounded-none border border-slate-200 hover:border-rose-400 shadow-sm text-left group transition flex flex-col justify-between min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-rose-100 text-rose-700 flex items-center justify-center mb-3 border border-rose-200 shrink-0">
              <Construction className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900">Mặt Đường & Ổ Gà</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">Hố sâu, sụt lún nguy hiểm</div>
            </div>
          </button>
        </div>
      </section>

      {/* 5. PHẢN ÁNH GẦN ĐÂY & ĐƯỜNG DÂY NÓNG */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Cột trái (2 cols): Phản ánh gần đây */}
        <div className="lg:col-span-2 bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2 min-w-0">
              <ClipboardList className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate">Hồ sơ phản ánh gần đây</span>
            </h3>
            <button
              onClick={() => navigate('/citizen/reports')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 transition whitespace-nowrap shrink-0"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-2.5">
            {myRecentReports.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/citizen/reports')}
                className="p-3 rounded-none border border-slate-200 hover:border-blue-600 bg-slate-50/60 hover:bg-blue-50/30 transition cursor-pointer flex items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-none overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img src={item.photosBefore[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-none border border-blue-200">
                        {item.code}
                      </span>
                      <span
                        className={`sm:hidden text-[10px] font-bold px-1.5 py-0.5 rounded-none border ${
                          item.status === 'resolved' || item.status === 'closed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.status === 'resolved' || item.status === 'closed' ? 'Đã xong' : 'Đang xử lý'}
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 min-w-0">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block shrink-0 text-right">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-none border whitespace-nowrap ${
                      item.status === 'resolved' || item.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {item.status === 'resolved' || item.status === 'closed' ? 'Đã xong' : 'Đang xử lý'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải (1 col): Danh bạ khẩn cấp */}
        <div className="bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 min-w-0">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-200 pb-2.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Đường dây nóng khẩn cấp</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Trực ban Công an Phường</div>
                <div className="text-[11px] text-slate-500 truncate">Tiếp nhận an ninh trật tự</div>
              </div>
              <a href="tel:02513822113" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                (0251) 3822.113
              </a>
            </div>

            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Sự cố Điện lực Biên Hòa</div>
                <div className="text-[11px] text-slate-500 truncate">Đứt dây điện, mất điện</div>
              </div>
              <a href="tel:19001006" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                1900.1006
              </a>
            </div>

            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Thoát nước & Cấp nước</div>
                <div className="text-[11px] text-slate-500 truncate">Vỡ đường ống, ngập sâu</div>
              </div>
              <a href="tel:02513822555" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                (0251) 3822.555
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

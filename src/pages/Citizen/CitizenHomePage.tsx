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
    <div className="space-y-6">
      {/* 1. HERO BANNER CHÀO MỪNG (GÓC VUÔNG) */}
      <div className="bg-blue-800 text-white rounded-none p-6 sm:p-8 shadow-md relative overflow-hidden border border-blue-900">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider text-white">
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse" />
            Hệ thống tiếp nhận 24/7 • Phường Trấn Biên
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Chung tay xây dựng Đô thị Trấn Biên Văn minh - An toàn
          </h1>

          <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
            Phát hiện đèn đường hỏng, ngập nước, bãi rác tự phát hay ổ gà nguy hiểm? Hãy chụp ảnh và gửi ngay, UBND Phường tiếp nhận xử lý trong thời gian cam kết.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/citizen/submit')}
              className={`flex items-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-none shadow-md transition active:scale-95 border border-amber-600 uppercase tracking-wide ${
                elderlyMode ? 'px-8 py-4 text-base' : 'px-6 py-3.5 text-sm'
              }`}
            >
              <Camera className="w-5 h-5 text-slate-900" />
              <span>GỬI PHẢN ÁNH MỚI (2 BƯỚC)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/citizen/reports')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-none border border-white/20 transition text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Xem danh sách phản ánh</span>
            </button>
          </div>
        </div>

        {/* Họa tiết trang trí nền */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:flex items-center justify-center">
          <Camera className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* 2. THỐNG KÊ NHANH DÀNH CHO CÔNG DÂN (GÓC VUÔNG) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-none p-4 border border-slate-300 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Tổng phản ánh tiếp nhận</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">12.450</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">● Toàn thành phố</div>
        </div>

        <div className="bg-white rounded-none p-4 border border-slate-300 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Đã khắc phục hoàn thành</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{resolvedCount} sự cố</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Có ảnh nghiệm thu</div>
        </div>

        <div className="bg-white rounded-none p-4 border border-slate-300 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Đang khẩn trương xử lý</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{pendingCount} sự cố</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">Đúng hạn cam kết SLA</div>
        </div>

        <div className="bg-white rounded-none p-4 border border-slate-300 shadow-2xs">
          <div className="text-slate-500 text-xs font-semibold">Mức độ hài lòng của dân</div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">96,8%</div>
          <div className="text-[11px] text-amber-500 font-bold mt-0.5">★ ★ ★ ★ ★ (4.9/5)</div>
        </div>
      </div>

      {/* 3. THÔNG BÁO KHẨN TỪ UBND PHƯỜNG (GÓC VUÔNG) */}
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-none p-4 sm:p-5 shadow-2xs border-y border-r border-slate-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm sm:text-base text-amber-900">
              Thông báo cảnh báo triều cường ngập cục bộ tại một số tuyến đường (11/2026)
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              UBND Phường Trấn Biên khuyến cáo người dân hạn chế di chuyển qua đoạn đường ven sông Đồng Nai và ngã 3 Tân Mai vào khung giờ từ 17h00 - 19h00. Nếu phát hiện cống nghẹt hoặc cây ngã, vui lòng gửi phản ánh ngay qua ứng dụng.
            </p>
          </div>
        </div>
      </div>

      {/* 4. CÁC DANH MỤC PHẢN ÁNH THƯỜNG GẶP (GÓC VUÔNG) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Bạn cần phản ánh vấn đề gì?
          </h2>
          <button
            onClick={() => navigate('/citizen/map')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center gap-1"
          >
            <span>Xem bản đồ sự cố quanh đây</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-4 bg-white hover:bg-amber-50/60 rounded-none border border-slate-300 shadow-2xs text-left group transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-none bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition border border-amber-200">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Đèn Chiếu Sáng</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Bóng cháy, mất điện, chập chờn</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-4 bg-white hover:bg-blue-50/60 rounded-none border border-slate-300 shadow-2xs text-left group transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition border border-blue-200">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Ngập Nước Sau Mưa</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Cống nghẹt, đọng nước sâu</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-4 bg-white hover:bg-emerald-50/60 rounded-none border border-slate-300 shadow-2xs text-left group transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition border border-emerald-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Rác Thải Tự Phát</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Bãi rác trái phép, bốc mùi hôi</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-4 bg-white hover:bg-rose-50/60 rounded-none border border-slate-300 shadow-2xs text-left group transition flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-none bg-rose-100 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition border border-rose-200">
              <Construction className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Mặt Đường & Ổ Gà</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Hố sâu, sụt lún nguy hiểm</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. PHẢN ÁNH GẦN ĐÂY CỦA TÔI & ĐƯỜNG DÂY NÓNG (GÓC VUÔNG) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cột trái (2 cols): Phản ánh gần đây */}
        <div className="lg:col-span-2 bg-white rounded-none border border-slate-300 shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Hồ sơ phản ánh gần đây</span>
            </h3>
            <button
              onClick={() => navigate('/citizen/reports')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 transition"
            >
              Xem tất cả phản ánh →
            </button>
          </div>

          <div className="space-y-2.5">
            {myRecentReports.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/citizen/reports')}
                className="p-3 rounded-none border border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-none overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img src={item.photosBefore[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded-none border border-blue-200">
                        {item.code}
                      </span>
                      <span className="text-[11px] text-slate-400">10 phút trước</span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-none border ${
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
        <div className="bg-white rounded-none border border-slate-300 shadow-2xs p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600" />
            <span>Đường dây nóng khẩn cấp</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Trực ban Công an Phường</div>
                <div className="text-[11px] text-slate-500">Tiếp nhận an ninh trật tự</div>
              </div>
              <a href="tel:02513822113" className="font-mono font-bold text-blue-700 hover:underline">
                (0251) 3822.113
              </a>
            </div>

            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Sự cố Điện lực Biên Hòa</div>
                <div className="text-[11px] text-slate-500">Đứt dây điện, mất điện</div>
              </div>
              <a href="tel:19001006" className="font-mono font-bold text-blue-700 hover:underline">
                1900.1006
              </a>
            </div>

            <div className="p-2.5 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Thoát nước & Cấp nước</div>
                <div className="text-[11px] text-slate-500">Vỡ đường ống, ngập sâu</div>
              </div>
              <a href="tel:02513822555" className="font-mono font-bold text-blue-700 hover:underline">
                (0251) 3822.555
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Shield,
  Home,
  ClipboardList,
  HelpCircle,
  Eye,
  ShieldAlert,
  PhoneCall,
  User,
  ArrowRight,
  Megaphone,
} from 'lucide-react';

export const CitizenTopNav: React.FC = () => {
  const navigate = useNavigate();
  const { elderlyMode, toggleElderlyMode, incidents } = useIncidentStore();
  const { currentUser, loginAs } = useAuthStore();

  const activeReportsCount = incidents.filter(
    (i) => i.status === 'pending' || i.status === 'assigned' || i.status === 'in_progress'
  ).length;

  // 3 MỤC CHUẨN (Đã bỏ Bản đồ khỏi thanh điều hướng và chuyển xuống Trang chủ)
  const navLinks = [
    {
      to: '/citizen/home',
      label: 'Trang chủ',
      icon: Home,
    },
    {
      to: '/citizen/reports',
      label: 'Phản ánh',
      icon: ClipboardList,
      badge: activeReportsCount > 0 ? `${activeReportsCount}` : undefined,
    },
    {
      to: '/citizen/help',
      label: 'Trợ giúp',
      icon: HelpCircle,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm select-none">
        {/* 1. THANH TIỆN ÍCH TRÊN CÙNG */}
        <div className="bg-blue-950 text-white text-[11px] sm:text-xs py-1.5">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-[5px] uppercase tracking-wider shrink-0">
                CỔNG DÂN SINH
              </span>
              <span className="font-medium truncate text-blue-100 hidden md:inline">
                UBND Phường Trấn Biên • TP. Biên Hòa, Tỉnh Đồng Nai
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-bold">
              <a
                href="tel:1022"
                className="flex items-center gap-1 text-white hover:text-amber-300 transition whitespace-nowrap"
                title="Tổng đài tiếp nhận phản ánh dịch vụ công"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Hotline:</span>
                <span>1022</span>
              </a>
              <span className="text-white/30">|</span>
              <button
                onClick={() => {
                  loginAs('officer');
                  navigate('/dashboard');
                }}
                className="flex items-center gap-1 text-white hover:text-cyan-200 bg-white/10 hover:bg-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-[5px] transition border border-white/20 whitespace-nowrap"
                title="Chuyển sang Bàn làm việc Cán bộ / Admin"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="hidden sm:inline">Bàn Cán Bộ /</span>
                <span>Admin</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. THANH ĐIỀU HƯỚNG CHÍNH (PC: THANH XANH GẠCH CHÂN BÊN DƯỚI KHI ACTIVE) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px] gap-2 sm:gap-4 min-w-0">
            {/* Logo & Tên Cổng Dịch Vụ */}
            <button
              onClick={() => navigate('/citizen/home')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group min-w-0 shrink"
              title="Về trang chủ công dân"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[5px] bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                    Trấn Biên SmartCity
                  </span>
                  <span className="hidden sm:inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-[5px] uppercase tracking-wider shrink-0">
                    Dân Sinh
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-slate-500 font-medium mt-1 truncate">
                  Cổng Tiếp Nhận Phản Ánh Hiện Trường
                </span>
              </div>
            </button>

            {/* 3 Navigation Links trên PC/Tablet (Gạch chân thanh xanh bên dưới thay vì khung xanh bao quanh) */}
            <nav className="hidden md:flex items-stretch h-full gap-1 lg:gap-2 shrink-0">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3.5 lg:px-5 text-sm font-bold transition whitespace-nowrap ${
                        isActive
                          ? 'text-blue-700'
                          : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-0.5 px-1.5 py-0.5 rounded-[5px] text-[10px] font-black bg-rose-600 text-white leading-none">
                            {item.badge}
                          </span>
                        )}
                        {/* Thanh xanh bên dưới mục đang chọn */}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-blue-700 rounded-t-[2px]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Tiện ích Phía Phải */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Chế độ Chữ Lớn */}
              <button
                onClick={toggleElderlyMode}
                type="button"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[5px] text-xs font-bold transition border whitespace-nowrap ${
                  elderlyMode
                    ? 'bg-amber-400 text-slate-900 border-amber-500 font-black'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Phóng to font chữ cho người cao tuổi"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {elderlyMode ? 'Đang bật Chữ Lớn' : 'Chữ Lớn'}
                </span>
                <span className="sm:hidden">{elderlyMode ? 'A+' : 'A'}</span>
              </button>

              {/* Profile Người Dân */}
              <div className="hidden xl:flex items-center gap-2.5 pl-3 border-l border-slate-200 shrink-0">
                <div className="w-8 h-8 rounded-[5px] bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left text-xs whitespace-nowrap">
                  <div className="font-extrabold text-slate-900 leading-none">
                    {currentUser.role === 'citizen' ? currentUser.name : 'Bác Hai Trấn Biên'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Công dân KP.2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (HIỂN THỊ DƯỚI CÙNG TRÊN ĐIỆN THOẠI NHƯ APP CHUYÊN NGHIỆP) */}
      <nav
        aria-label="Điều hướng công dân trên điện thoại"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_18px_rgba(15,23,42,0.08)]"
      >
        <div className="grid grid-cols-3 items-end h-[64px] max-w-md mx-auto px-2 pb-1.5">
          {/* Mục 1: Trang chủ */}
          <NavLink
            to="/citizen/home"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 transition ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="text-[11px] leading-none">Trang chủ</span>
              </>
            )}
          </NavLink>

          {/* Mục 2 (Giữa - Nổi bật màu xanh như ảnh mẫu): Phản ánh */}
          <NavLink
            to="/citizen/reports"
            className={({ isActive }) =>
              `flex flex-col items-center justify-end gap-1 pb-1 transition ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-600 font-semibold'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative -mt-7">
                  <div
                    className={`w-13 h-13 w-[54px] h-[54px] rounded-[14px] flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-blue-700 text-white shadow-blue-700/40 ring-4 ring-white'
                        : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/30 ring-4 ring-white'
                    }`}
                  >
                    <Megaphone className="w-6 h-6 text-white" />
                  </div>
                  {activeReportsCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-center rounded-[5px] text-[10px] font-black bg-rose-600 text-white border border-white leading-none">
                      {activeReportsCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-none">Phản ánh</span>
              </>
            )}
          </NavLink>

          {/* Mục 3: Trợ giúp */}
          <NavLink
            to="/citizen/help"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 transition ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <HelpCircle className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="text-[11px] leading-none">Trợ giúp</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
};

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Home,
  ClipboardList,
  HelpCircle,
  Eye,
  PhoneCall,
  User,
  LogIn,
} from 'lucide-react';

export const CitizenTopNav: React.FC = () => {
  const navigate = useNavigate();
  const { elderlyMode, toggleElderlyMode, incidents } = useIncidentStore();
  const { isAuthenticated, currentUser } = useAuthStore();

  const activeReportsCount = incidents.filter(
    (i) => i.status === 'pending' || i.status === 'assigned' || i.status === 'in_progress'
  ).length;

  // 3 mục khi chưa đăng nhập; 4 mục (thêm Tài khoản) khi đã đăng nhập
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
    ...(isAuthenticated
      ? [
          {
            to: '/citizen/account',
            label: 'Tài khoản',
            icon: User,
          },
        ]
      : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm select-none">
        {/* 1. THANH TIỆN ÍCH TRÊN CÙNG (Đã xóa nút chuyển qua Admin) */}
        <div className="bg-blue-950 text-white text-[11px] sm:text-xs py-1.5">
          <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-[5px] uppercase tracking-wider shrink-0">
                CỔNG DÂN SINH
              </span>
              <span className="font-medium truncate text-blue-100 hidden md:inline">
                UBND Phường Trấn Biên • TP. Biên Hòa, Tỉnh Đồng Nai
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-semibold">
              <a
                href="tel:1022"
                className="flex items-center gap-1 text-white hover:text-amber-300 transition whitespace-nowrap"
                title="Tổng đài tiếp nhận phản ánh dịch vụ công"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Hotline:</span>
                <span>1022</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. THANH ĐIỀU HƯỚNG CHÍNH */}
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px] gap-2 sm:gap-4 min-w-0">
            {/* Logo & Tên Cổng Dịch Vụ */}
            <button
              onClick={() => navigate('/citizen/home')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group min-w-0 shrink"
              title="Về trang chủ công dân"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[5px] overflow-hidden bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                <img
                  src="/images/ctix-logo.jpg"
                  alt="Trấn Biên SmartCity Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 tracking-tight leading-none truncate">
                  Trấn Biên SmartCity
                </span>
              </div>
            </button>

            {/* Navigation Links trên PC/Tablet */}
            <nav className="hidden md:flex items-stretch h-full gap-1 lg:gap-2 shrink-0">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3.5 lg:px-5 text-sm font-semibold transition whitespace-nowrap ${
                        isActive
                          ? 'text-blue-700'
                          : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-blue-700' : 'text-slate-500'
                          }`}
                        />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-0.5 px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-rose-600 text-white leading-none">
                            {item.badge}
                          </span>
                        )}
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
              {/* Chế độ Người cao tuổi */}
              <button
                onClick={toggleElderlyMode}
                type="button"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition border whitespace-nowrap ${
                  elderlyMode
                    ? 'bg-amber-400 text-slate-950 border-slate-900 font-bold shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title="Bật giao diện tối giản, chữ lớn và tương phản cao cho người cao tuổi"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {elderlyMode ? '✓ Chế độ Người cao tuổi' : 'Người cao tuổi'}
                </span>
                <span className="sm:hidden">{elderlyMode ? '✓ A+' : 'A+'}</span>
              </button>

              {/* Đã đăng nhập: hiện tên tài khoản dẫn tới /citizen/account | Chưa đăng nhập: nút Đăng nhập */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate('/citizen/account')}
                  className="hidden xl:flex items-center gap-2.5 pl-3 border-l border-slate-200 shrink-0 hover:opacity-85 transition"
                  title="Xem & chỉnh sửa thông tin tài khoản"
                >
                  <div className="w-8 h-8 rounded-[5px] bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="text-left text-xs whitespace-nowrap">
                    <div className="font-semibold text-slate-800 leading-none">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">
                      {currentUser.phone}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition whitespace-nowrap shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR — ĐƠN GIẢN, ĐẸP, KHUNG ACTIVE CHẠY THEO TRANG ĐANG CHỌN */}
      <nav
        aria-label="Điều hướng công dân trên điện thoại"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_12px_rgba(15,23,42,0.06)]"
      >
        <div
          className={`grid ${
            isAuthenticated ? 'grid-cols-4' : 'grid-cols-3'
          } items-center h-[62px] max-w-md mx-auto px-1.5 gap-1`}
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-[8px] transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Thanh mảnh dưới cùng đánh dấu tab đang chọn */}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-blue-700 rounded-t-full" />
                    )}
                    <div className="relative">
                      <Icon
                        className={`w-[20px] h-[20px] ${
                          isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'
                        }`}
                      />
                      {item.badge && (
                        <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold bg-rose-600 text-white border border-white leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

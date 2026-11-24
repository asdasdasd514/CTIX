import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Shield,
  Home,
  ClipboardList,
  MapPin,
  HelpCircle,
  Eye,
  ShieldAlert,
  Menu,
  X,
  PhoneCall,
  User,
  ArrowRight,
} from 'lucide-react';

export const CitizenTopNav: React.FC = () => {
  const navigate = useNavigate();
  const { elderlyMode, toggleElderlyMode, incidents } = useIncidentStore();
  const { currentUser, loginAs } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeReportsCount = incidents.filter(
    (i) => i.status === 'pending' || i.status === 'assigned' || i.status === 'in_progress'
  ).length;

  // 4 MỤC CHUẨN: Trang chủ / Phản ánh / Bản đồ / Trợ giúp
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
      to: '/citizen/map',
      label: 'Bản đồ',
      icon: MapPin,
    },
    {
      to: '/citizen/help',
      label: 'Trợ giúp',
      icon: HelpCircle,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-300 shadow-sm select-none">
      {/* 1. THANH TIỆN ÍCH TRÊN CÙNG (GỌN GÀNG, CHỐNG TRÀN TRÊN MOBILE) */}
      <div className="bg-blue-950 text-white text-[11px] sm:text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider shrink-0">
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
              className="flex items-center gap-1 text-white hover:text-cyan-200 bg-white/10 hover:bg-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-none transition border border-white/20 whitespace-nowrap"
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

      {/* 2. THANH ĐIỀU HƯỚNG CHÍNH (PC: 1 HÀNG NGANG CHUẨN | MOBILE/TABLET: GỌN + MENU DROPDOWN) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px] gap-2 sm:gap-4 min-w-0">
          {/* Logo & Tên Cổng Dịch Vụ */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/citizen/home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 text-left group min-w-0 shrink"
            title="Về trang chủ công dân"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight leading-none truncate">
                  Trấn Biên SmartCity
                </span>
                <span className="hidden sm:inline-block bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-none uppercase tracking-wider shrink-0">
                  Dân Sinh
                </span>
              </div>
              <span className="hidden sm:block text-[11px] text-slate-500 font-medium mt-1 truncate">
                Cổng Tiếp Nhận Phản Ánh Hiện Trường
              </span>
            </div>
          </button>

          {/* 4 Navigation Links trên PC (lg trở lên để không bao giờ chèn ép ở Tablet) */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-none text-sm font-bold transition whitespace-nowrap border ${
                      isActive
                        ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                        : 'border-transparent text-slate-700 hover:text-blue-700 hover:bg-slate-100 hover:border-slate-300'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-none text-[10px] font-black bg-rose-600 text-white leading-none">
                      {item.badge}
                    </span>
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-none text-xs font-bold transition border whitespace-nowrap ${
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

            {/* Profile Người Dân (hiển thị từ xl trở lên để desktop rộng rãi, không chật) */}
            <div className="hidden xl:flex items-center gap-2.5 pl-3 border-l border-slate-200 shrink-0">
              <div className="w-8 h-8 rounded-none bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
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

            {/* Mobile / Tablet Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Mở menu điều hướng"
              className="lg:hidden p-2 rounded-none border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE & TABLET DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-3 sm:px-6 py-3 space-y-1.5 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-none text-sm font-bold transition border ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-none text-xs font-bold bg-rose-600 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2.5 mt-2 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
              <div className="w-7 h-7 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800 truncate">
                {currentUser.role === 'citizen' ? currentUser.name : 'Bác Hai Trấn Biên'}
              </span>
            </div>
            <button
              onClick={() => {
                loginAs('officer');
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-none bg-slate-900 text-white text-xs font-bold shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bàn Admin</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

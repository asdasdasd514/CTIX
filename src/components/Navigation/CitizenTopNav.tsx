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

  // Đếm phản ánh của người dân đang giải quyết
  const activeReportsCount = incidents.filter(
    (i) => i.status === 'pending' || i.status === 'assigned' || i.status === 'in_progress'
  ).length;

  // 4 MỤC CHUẨN THEO YÊU CẦU: Trang chủ / Phản ánh / Bản đồ / Trợ giúp
  const navLinks = [
    {
      to: '/citizen/home',
      label: 'Trang chủ',
      icon: Home,
      exact: true,
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-xs select-none">
      {/* 1. THANH THÔNG BÁO KHẨN & HOTLINE ĐÔ THỊ TRÊN CÙNG */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 text-white text-xs py-2 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-xs">
              CỔNG DÂN SINH
            </span>
            <span className="font-semibold truncate text-blue-100 hidden sm:inline">
              UBND Phường Trấn Biên • TP. Biên Hòa, Tỉnh Đồng Nai
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
            <a
              href="tel:1022"
              className="flex items-center gap-1.5 text-white hover:text-amber-300 transition"
              title="Tổng đài tiếp nhận phản ánh dịch vụ công"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">Hotline: 1022</span>
            </a>
            <span className="text-white/30">|</span>
            <button
              onClick={() => {
                loginAs('officer');
                navigate('/dashboard');
              }}
              className="flex items-center gap-1.5 text-white hover:text-cyan-200 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition border border-white/20 shadow-2xs group whitespace-nowrap"
              title="Chuyển sang Bàn làm việc Cán bộ / IOC"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition shrink-0" />
              <span>Bàn Cán Bộ / Admin</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN TOP NAVIGATION BAR (4 MỤC: TRANG CHỦ / PHẢN ÁNH / BẢN ĐỒ / TRỢ GIÚP) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Tên Cổng Dịch Vụ */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/citizen/home')}
              className="flex items-center gap-3 text-left group"
              title="Về trang chủ công dân"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                    Trấn Biên SmartCity
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap">
                    Dân Sinh
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-wide mt-1 whitespace-nowrap">
                  Cổng Tiếp Nhận Phản Ánh Hiện Trường
                </span>
              </div>
            </button>
          </div>

          {/* 4 Navigation Links (Trang chủ / Phản ánh / Bản đồ / Trợ giúp) */}
          <nav className="hidden md:flex items-center gap-2 shrink-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-500/20'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs shrink-0 whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Tiện ích Phía Phải (Chữ Lớn + Profile Người Dân + Mobile Menu Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap">
            {/* Chế độ Chữ Lớn */}
            <button
              onClick={toggleElderlyMode}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border shrink-0 whitespace-nowrap ${
                elderlyMode
                  ? 'bg-amber-400 text-slate-900 border-amber-500 font-black shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Phóng to font chữ cho người cao tuổi"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{elderlyMode ? '✓ Đang bật Chữ Lớn' : '👓 Chữ Lớn'}</span>
            </button>

            {/* Profile Người Dân */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200 shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left text-xs whitespace-nowrap">
                <div className="font-extrabold text-slate-900 leading-none whitespace-nowrap">
                  {currentUser.role === 'citizen' ? currentUser.name : 'Bác Hai Trấn Biên'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-medium whitespace-nowrap">
                  Công dân KP.2
                </div>
              </div>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                loginAs('officer');
                setMobileMenuOpen(false);
                navigate('/dashboard');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Chuyển sang Bàn Cán Bộ / Admin</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

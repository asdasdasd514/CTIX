import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, PRESET_ACCOUNTS } from '../store/useAuthStore';
import { useIncidentStore } from '../store/useIncidentStore';
import { Sidebar } from '../components/Sidebar/Sidebar';
import {
  Bell,
  Search,
  Eye,
  LogOut,
  ChevronDown,
  RotateCcw,
  Menu,
  Users,
  ExternalLink,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loginAs } = useAuthStore();
  const { elderlyMode, toggleElderlyMode, resetToDefaultData, incidents } = useIncidentStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);

  const pendingCount = incidents.filter((i) => i.status === 'pending').length;

  // Tiêu đề trang động cho Topbar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard' || path.startsWith('/admin/dashboard')) {
      return {
        main: 'Bảng Điều Hành Tổng Thể & Giám Sát Phản Ánh Đô Thị',
        sub: 'Trung tâm Điều hành IOC Tỉnh Đồng Nai • Phường Trấn Biên',
      };
    }
    if (path === '/inbox' || path.startsWith('/admin/inbox')) {
      return {
        main: '04 - Tiếp Nhận & Phân Công Phản Ánh Hiện Trường',
        sub: 'Bàn làm việc Cán bộ UBND Phường Trấn Biên (Desktop Cán Bộ)',
      };
    }
    if (path.startsWith('/dispatch') || path.startsWith('/admin/dispatch')) {
      return {
        main: '05 - Phân Công & Điều Phối Xử Lý Sự Cố',
        sub: 'Chỉ đạo đơn vị cơ động tiếp ứng giải quyết trong thời hạn SLA',
      };
    }
    if (path === '/map' || path.startsWith('/admin/map')) {
      return {
        main: 'Bản Đồ Số Không Gian Giám Sát Đô Thị',
        sub: 'Trực quan hóa vị trí các phản ánh trên OpenStreetMap thời gian thực',
      };
    }
    return {
      main: 'Nhiệm Vụ Xác Minh & Nghiệm Thu Hiện Trường',
      sub: 'Đội Thanh niên Tình nguyện & Đội cơ động (Ảnh Before - After)',
    };
  };

  const pageTitle = getPageTitle();

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans ${
        elderlyMode ? 'elderly-mode' : ''
      }`}
    >
      {/* 1. SIDEBAR DESKTOP ADMIN (Y hệt IRS: dark navy #0b132b, w-20/w-64, la bàn xoay, vạch phát sáng) */}
      <div className="hidden lg:block shrink-0 h-screen">
        <Sidebar />
      </div>

      {/* 2. MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 3. MOBILE DRAWER SIDEBAR */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      {/* 4. KHU VỰC NỘI DUNG CHÍNH (TOPBAR TRẮNG + SCROLLABLE CONTENT) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TOPBAR TRẮNG TINH TẾ */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
          {/* Nút Mobile Menu + Tiêu Đề Phân Hệ */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 transition shrink-0"
              title="Mở thanh điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight truncate">
                {pageTitle.main}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                {pageTitle.sub}
              </p>
            </div>
          </div>

          {/* Ô Tìm Kiếm Nhanh */}
          <div className="hidden xl:flex items-center flex-1 max-w-xs mx-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã PA-001, tên đường..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Cụm Thao Tác Phía Phải */}
          <div className="flex items-center gap-2 shrink-0">
            {/* NÚT CHUYỂN SANG CỔNG NGƯỜI DÂN (PORTAL SWITCHER) */}
            <button
              onClick={() => {
                loginAs('citizen');
                navigate('/citizen/home');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs group"
              title="Chuyển sang Cổng Dịch Vụ Công Dân (Người Dân)"
            >
              <Users className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition" />
              <span>👤 Cổng Người Dân</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>

            {/* Chế độ Chữ Lớn */}
            <button
              onClick={toggleElderlyMode}
              type="button"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                elderlyMode
                  ? 'bg-amber-400 text-slate-900 border-amber-500 font-bold shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Phóng to font chữ cho người cao tuổi"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{elderlyMode ? '✓ Đang bật Chữ Lớn' : '👓 Chữ Lớn'}</span>
            </button>

            {/* Reset Data Mẫu */}
            <button
              onClick={() => {
                if (window.confirm('Khôi phục 64 phản ánh gốc của Phường Trấn Biên?')) {
                  resetToDefaultData();
                }
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Chuông Thông Báo */}
            <div className="relative">
              <button
                onClick={() => setShowNotiDropdown(!showNotiDropdown)}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition relative"
                title="Thông báo khẩn cấp"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>

              {showNotiDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-slate-800 z-50">
                  <div className="font-bold text-xs text-slate-700 uppercase border-b pb-2 mb-2 flex items-center justify-between">
                    <span>Thông báo mới ({pendingCount})</span>
                    <span className="text-[10px] text-blue-600 cursor-pointer">Đánh dấu đã đọc</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                      <div className="font-bold text-[11px] text-rose-700">PA-001 (Khẩn cấp • 10 phút trước)</div>
                      <p className="mt-0.5">Ổ gà sâu nguy hiểm trên đường Võ Thị Sáu cần phân công gấp.</p>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                      <div className="font-bold text-[11px] text-amber-700">PA-002 (Cần xử lý)</div>
                      <p className="mt-0.5">Đèn chiếu sáng tắt hẳn tại Hẻm 42 Nguyễn Ái Quốc.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Cán Bộ */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-1 sm:pr-1.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{currentUser.title}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 text-slate-800 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tài khoản công vụ</span>
                    <div className="font-bold text-xs text-slate-800">{currentUser.name}</div>
                    <div className="text-[11px] text-blue-600">{currentUser.department}</div>
                  </div>

                  <div className="py-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold px-3 py-1 block">
                      Đổi nhanh vai trò:
                    </span>
                    {Object.entries(PRESET_ACCOUNTS).map(([key, acc]) => (
                      <button
                        key={key}
                        onClick={() => {
                          loginAs(key as any);
                          setShowUserDropdown(false);
                          if (key === 'citizen') navigate('/citizen/home');
                          else if (key === 'volunteer') navigate('/field/tasks');
                          else navigate('/inbox');
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded hover:bg-slate-100 flex items-center justify-between ${
                          currentUser.id === acc.id ? 'font-bold text-blue-700 bg-blue-50' : 'text-slate-700'
                        }`}
                      >
                        <span>{acc.name} ({acc.role})</span>
                        {currentUser.id === acc.id && <span className="text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 font-semibold hover:bg-rose-50 rounded flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* NỘI DUNG TRANG CUỘN (SCROLLABLE MAIN CONTAINER) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

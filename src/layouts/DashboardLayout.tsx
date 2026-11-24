import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardLayout() {
  const { currentUser, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const title = pathname.includes('statistics')
    ? 'Thống kê'
    : pathname.includes('field') || pathname.includes('verify')
      ? 'Nhiệm vụ hiện trường'
      : pathname.includes('dispatch')
        ? 'Chi tiết & phân công'
        : pathname.includes('inbox')
          ? 'Tiếp nhận'
          : pathname.includes('settings')
            ? 'Cài đặt'
            : pathname.includes('map')
              ? 'Bản đồ'
              : 'Dashboard';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell bg-slate-50">
      {/* Sidebar Desktop */}
      <div className="admin-desktop-sidebar">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Drawer */}
      {menuOpen && (
        <div
          className="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng quản trị"
        >
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
          <div className="drawer-content">
            <Sidebar onCloseMobile={() => setMenuOpen(false)} />
            <button
              type="button"
              className="drawer-close"
              aria-label="Đóng menu"
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Vùng nội dung chính căn đều chuẩn như trang Công dân */}
      <div className="admin-content min-w-0 flex-1 flex flex-col bg-slate-50">
        {/* Header trên cùng: Trái là Tiêu đề | Phải chỉ có Tên & Dropdown Đăng xuất */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="work-icon-button mobile-menu"
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
                {title}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                UBND Phường Trấn Biên • TP. Biên Hòa
              </p>
            </div>
          </div>

          {/* Góc phải: Tên tài khoản + Menu Dropdown Đăng xuất */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              aria-expanded={userDropdownOpen}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-[5px] bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className="w-8 h-8 rounded-[5px] bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-slate-900 leading-none">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  Quản trị viên
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-[5px] border border-slate-200 shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100 sm:hidden">
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span className="truncate">{currentUser.name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Nội dung chính mở rộng toàn chiều rộng màn hình máy tính, không dư khoảng trống 2 bên */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

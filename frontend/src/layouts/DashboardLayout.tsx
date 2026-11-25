import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  MapPin,
  Inbox,
  Users,
  UserCog,
  ClipboardList,
  ChartNoAxesCombined,
  MessageSquare,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { useAuthStore } from '../store/useAuthStore';

export function DashboardLayout() {
  const { currentUser, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const routeMeta = pathname.includes('feedbacks')
    ? { title: 'Góp ý công dân', subtitle: 'Ý kiến đóng góp từ trang Trợ giúp', icon: MessageSquare }
    : pathname.includes('statistics')
    ? { title: 'Thống kê', subtitle: 'Báo cáo tổng hợp & hiệu suất xử lý', icon: ChartNoAxesCombined }
    : pathname.includes('accounts')
      ? { title: 'Quản lý tài khoản', subtitle: 'Quản lý tài khoản công dân, quản trị viên và đội xử lý', icon: UserCog }
      : pathname.includes('members')
      ? { title: 'Thành viên & Nhóm', subtitle: 'Quản lý nhân sự hiện trường và các tổ đội', icon: Users }
      : pathname.includes('field') || pathname.includes('verify')
        ? { title: 'Nhiệm vụ hiện trường', subtitle: 'Theo dõi tiến độ xử lý & nghiệm thu', icon: ClipboardList }
        : pathname.includes('dispatch')
          ? { title: 'Chi tiết & phân công', subtitle: 'Điều phối nhân lực xử lý phản ánh', icon: Inbox }
          : pathname.includes('inbox')
            ? { title: 'Tiếp nhận', subtitle: 'Hàng đợi tiếp nhận và phân loại phản ánh', icon: Inbox }
            : pathname.includes('settings')
              ? { title: 'Cài đặt', subtitle: 'Cấu hình hệ thống cổng quản trị', icon: Settings }
              : pathname.includes('map')
                ? { title: 'Bản đồ', subtitle: 'Bản đồ số hiện trường Phường Trấn Biên', icon: MapPin }
                : { title: 'Dashboard', subtitle: 'Trung tâm điều hành thông minh Phường Trấn Biên', icon: LayoutDashboard };

  const PageIcon = routeMeta.icon;

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

  const initials = currentUser.name
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

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

      {/* Vùng nội dung chính */}
      <div className="admin-content min-w-0 flex-1 flex flex-col bg-slate-50">
        {/* Header trên cùng tinh gọn, sang trọng */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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

            <div className="hidden sm:flex w-9 h-9 rounded-[5px] bg-blue-50 border border-blue-100 text-blue-700 items-center justify-center shrink-0">
              <PageIcon className="w-[18px] h-[18px]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] sm:text-base font-bold text-slate-800 tracking-tight truncate leading-tight">
                  {routeMeta.title}
                </h1>
                <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 border border-slate-200/80">
                  Phường Trấn Biên
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {routeMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Góc phải: Tên tài khoản + Menu Dropdown Đăng xuất */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen((prev) => !prev)}
              aria-expanded={userDropdownOpen}
              className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-[5px] border transition ${
                userDropdownOpen
                  ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-[5px] bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>Quản trị viên</span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  userDropdownOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-[5px] border border-slate-200 shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Cán bộ điều hành • UBND P. Trấn Biên
                  </div>
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-[4px] text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Nội dung chính mở rộng toàn chiều rộng */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

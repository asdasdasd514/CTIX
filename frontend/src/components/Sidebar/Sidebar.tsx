import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Inbox,
  Users,
  UserCog,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';

export function Sidebar({
  onCloseMobile,
}: {
  onCloseMobile?: () => void;
}) {
  const { sidebarCollapsed, toggleSidebar, incidents } = useIncidentStore();
  const { currentUser } = useAuthStore();
  const collapsed = sidebarCollapsed && !onCloseMobile;
  const isFieldStaff = currentUser.role === 'volunteer';

  const pending = incidents.filter(
    (i) => i.status === 'pending_review' || i.status === 'pending'
  ).length;

  // Số nhiệm vụ đang giao cho Tổ / cá nhân của nhân viên Tổ xử lý
  const myFieldActiveCount = incidents.filter((i) => {
    if (i.status !== 'assigned' && i.status !== 'in_progress') return false;
    const matchAssignee = i.assignedTo?.assigneeName?.trim() === currentUser.name;
    const matchUnit =
      currentUser.department &&
      i.assignedTo?.unitName &&
      i.assignedTo.unitName.toLowerCase() === currentUser.department.toLowerCase();
    return matchAssignee || matchUnit;
  }).length;

  const mainItems = isFieldStaff
    ? [
        {
          path: '/admin/field-tasks',
          label: 'Nhiệm vụ hiện trường',
          icon: ClipboardList,
          badge: myFieldActiveCount,
        },
        { path: '/admin/map', label: 'Bản đồ hiện trường', icon: MapPin },
      ]
    : [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/map', label: 'Bản đồ', icon: MapPin },
        { path: '/admin/inbox', label: 'Tiếp nhận', icon: Inbox, badge: pending },
        { path: '/admin/members', label: 'Thành viên & Nhóm', icon: Users },
        { path: '/admin/accounts', label: 'Tài khoản', icon: UserCog },
        { path: '/admin/field-tasks', label: 'Nhiệm vụ hiện trường', icon: ClipboardList },
        { path: '/admin/statistics', label: 'Thống kê', icon: ChartNoAxesCombined },
      ];

  return (
    <aside className={`officer-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Bấm vào Logo / Icon để đóng mở mượt, icon giữ nguyên 36x36 căn giữa chuẩn không bị cắt */}
      <button
        type="button"
        onClick={!onCloseMobile ? toggleSidebar : undefined}
        title={collapsed ? 'Bấm vào icon để mở rộng menu' : 'Bấm vào icon để thu gọn menu'}
        aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        className="sidebar-brand"
      >
        <img
          src="/images/ctix-logo.jpg"
          alt="CTIX Logo"
          className="w-9 h-9 rounded-[5px] object-cover bg-white shrink-0 border border-white/25 shadow-sm"
        />
        <div className="sidebar-brand-text">
          <strong>Trấn Biên SmartCity</strong>
          <span>Cổng Quản Trị CTIX</span>
        </div>
      </button>

      {/* Menu chính */}
      <nav aria-label="Điều hướng quản trị" className="mt-2">
        {mainItems.map(({ path, label, icon: Icon, badge }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-nav-icon">
              <Icon size={19} />
            </span>
            <span className="sidebar-nav-label">{label}</span>
            {badge !== undefined && badge > 0 && (
              <b className="sidebar-nav-badge">{badge}</b>
            )}
          </NavLink>
        ))}

        <div className="my-2 mx-3 border-t border-white/10" />

        <NavLink
          to="/admin/settings"
          onClick={onCloseMobile}
          title={collapsed ? 'Cài đặt' : undefined}
        >
          <span className="sidebar-nav-icon">
            <Settings size={19} />
          </span>
          <span className="sidebar-nav-label">Cài đặt</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;

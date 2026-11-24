import { NavLink } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  MapPin,
  Inbox,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
} from 'lucide-react';
import { useIncidentStore } from '../../store/useIncidentStore';

export function Sidebar({
  onCloseMobile,
}: {
  onCloseMobile?: () => void;
}) {
  const { sidebarCollapsed, toggleSidebar, incidents } = useIncidentStore();
  const collapsed = sidebarCollapsed && !onCloseMobile;
  const pending = incidents.filter((i) => i.status === 'pending').length;

  const mainItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/map', label: 'Bản đồ', icon: MapPin },
    { path: '/inbox', label: 'Tiếp nhận', icon: Inbox, badge: pending },
    { path: '/field/tasks', label: 'Nhiệm vụ hiện trường', icon: ClipboardList },
    { path: '/statistics', label: 'Thống kê', icon: ChartNoAxesCombined },
  ];

  return (
    <aside className={`officer-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header đồng nhất logo CTIX */}
      <div className="sidebar-brand">
        <img
          src="/images/ctix-logo.jpg"
          alt="CTIX Logo"
          className="w-9 h-9 rounded-[5px] object-cover bg-white shrink-0 border border-white/20"
        />
        {!collapsed && (
          <div className="min-w-0">
            <strong className="tracking-tight">Trấn Biên SmartCity</strong>
            <span>Cổng Quản Trị CTIX</span>
          </div>
        )}
      </div>

      {/* Menu chính (Dashboard / Bản đồ / Tiếp nhận / Nhiệm vụ hiện trường / Thống kê) */}
      <nav aria-label="Điều hướng quản trị" className="mt-2">
        {mainItems.map(({ path, label, icon: Icon, badge }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
          >
            <Icon size={19} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">{label}</span>
                {badge !== undefined && badge > 0 && <b>{badge}</b>}
              </>
            )}
          </NavLink>
        ))}

        {/* Ngăn cách nhẹ trước Cài đặt */}
        <div className="my-2 border-t border-white/10" />

        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          title={collapsed ? 'Cài đặt' : undefined}
        >
          <Settings size={19} className="shrink-0" />
          {!collapsed && <span className="truncate">Cài đặt</span>}
        </NavLink>
      </nav>

      {/* Nút thu gọn Sidebar trên PC */}
      {!onCloseMobile && (
        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <>
                <PanelLeftClose size={19} />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;

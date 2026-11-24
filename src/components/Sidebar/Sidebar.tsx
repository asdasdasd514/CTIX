import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  ChartNoAxesCombined,
  LogOut,
} from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
export function Sidebar({
  onCloseMobile,
  mobileFooter,
}: {
  onCloseMobile?: () => void;
  mobileFooter?: ReactNode;
}) {
  const { sidebarCollapsed, toggleSidebar, incidents } = useIncidentStore();
  const collapsed = sidebarCollapsed && !onCloseMobile;
  const pending = incidents.filter((i) => i.status === "pending").length;
  const items = [
    { path: "/dashboard", label: "Bàn làm việc", icon: LayoutDashboard },
    { path: "/map", label: "Bản đồ phản ánh", icon: MapPin },
    {
      path: "/field/tasks",
      label: "Nhiệm vụ hiện trường",
      icon: ClipboardList,
    },
    { path: "/statistics", label: "Thống kê", icon: ChartNoAxesCombined },
  ];
  return (
    <aside className={`officer-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <Shield size={25} />
        {!collapsed && (
          <div>
            <strong>CTIX</strong>
            <span>Phản ánh hiện trường</span>
          </div>
        )}
      </div>
      <div className="sidebar-locality">
        {!collapsed && (
          <>
            <span>ĐỊA BÀN PHỤ TRÁCH</span>
            <strong>Phường Trấn Biên</strong>
          </>
        )}
      </div>
      <nav aria-label="Điều hướng cán bộ">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} />
            {!collapsed && (
              <>
                <span>{label}</span>
                {path === "/dashboard" && pending > 0 && <b>{pending}</b>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {onCloseMobile && mobileFooter}
        {!collapsed && <p>Dữ liệu demo · Tháng 11/2026</p>}
        <NavLink to="/login" onClick={onCloseMobile}>
          <LogOut size={19} />
          {!collapsed && <span>Đổi tài khoản</span>}
        </NavLink>
        {!onCloseMobile && (
          <button
            onClick={toggleSidebar}
            aria-label={
              collapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
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
        )}
      </div>
    </aside>
  );
}
export default Sidebar;

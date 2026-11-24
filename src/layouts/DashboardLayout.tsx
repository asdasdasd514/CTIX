import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Eye,
  RotateCcw,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { useIncidentStore } from "../store/useIncidentStore";
import { useAuthStore, PRESET_ACCOUNTS } from "../store/useAuthStore";
import { formatDate } from "../lib/incidents";

export function DashboardLayout() {
  const { elderlyMode, toggleElderlyMode, resetToDefaultData, lastSyncedAt } =
    useIncidentStore();
  const { currentUser, loginAs } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pathname.includes("statistics")
    ? "Thống kê phản ánh"
    : pathname.includes("field") || pathname.includes("verify")
      ? "Nhiệm vụ hiện trường"
      : pathname.includes("dispatch")
        ? "Chi tiết phản ánh"
        : pathname.includes("map")
          ? "Bản đồ phản ánh"
          : "Bàn làm việc cán bộ";

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleResetDemo = () => {
    if (
      confirm(
        "Khôi phục 64 hồ sơ mẫu? Các phản ánh và thay đổi demo trên máy này sẽ bị thay thế.",
      )
    ) {
      resetToDefaultData();
      setMenuOpen(false);
    }
  };

  return (
    <div className="admin-shell">
      <div className="admin-desktop-sidebar">
        <Sidebar />
      </div>
      {menuOpen && (
        <div
          className="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Điều hướng cán bộ"
        >
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
          <div className="drawer-content">
            <Sidebar
              onCloseMobile={() => setMenuOpen(false)}
              mobileFooter={
                <div className="sidebar-mobile-controls">
                  <label className="sidebar-role-field">
                    <span>Vai trò demo</span>
                    <select
                      aria-label="Vai trò demo trong menu"
                      value={currentUser.role}
                      onChange={(e) => loginAs(e.target.value)}
                    >
                      {Object.entries(PRESET_ACCOUNTS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={handleResetDemo}>
                    <RotateCcw size={18} />
                    <span>Khôi phục dữ liệu mẫu</span>
                  </button>
                </div>
              }
            />
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
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-title">
            <button
              type="button"
              className="work-icon-button mobile-menu"
              aria-label="Mở điều hướng"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="admin-title-text">
              <h1>{title}</h1>
              <p>UBND Phường Trấn Biên</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              className={`work-icon-button ${elderlyMode ? "is-active" : ""}`}
              aria-label="Bật hoặc tắt chữ lớn"
              aria-pressed={elderlyMode}
              title={elderlyMode ? "Tắt chữ lớn" : "Bật chữ lớn"}
              onClick={toggleElderlyMode}
            >
              <Eye size={19} />
            </button>
            <button
              type="button"
              className="work-icon-button desktop-only-action"
              aria-label="Khôi phục dữ liệu mẫu"
              title="Khôi phục 64 hồ sơ mẫu"
              onClick={handleResetDemo}
            >
              <RotateCcw size={18} />
            </button>
            <label className="admin-account desktop-only-action">
              <span className="admin-avatar" aria-hidden="true">
                {currentUser.name.charAt(0)}
              </span>
              <span className="sr-only">Vai trò demo</span>
              <select
                aria-label="Vai trò demo"
                value={currentUser.role}
                onChange={(e) => loginAs(e.target.value)}
              >
                {Object.entries(PRESET_ACCOUNTS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <div className="admin-demo-bar">
          <span className="demo-status">
            <RefreshCw size={14} aria-hidden="true" />
            <span>Demo đồng bộ trên máy này</span>
            <span className="demo-update">
              · Cập nhật {formatDate(lastSyncedAt)}
            </span>
          </span>
          <div className="demo-links">
            <Link
              to="/citizen/submit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tab người dân <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <Link to="/field/tasks" target="_blank" rel="noopener noreferrer">
              Tab hiện trường <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

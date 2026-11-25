import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CitizenLayout } from './layouts/CitizenLayout';
import { IocDashboardPage } from './pages/Dashboard/IocDashboardPage';
import { AdminMapPage } from './pages/Dashboard/AdminMapPage';
import { StatisticsPage } from './pages/Dashboard/StatisticsPage';
import { AdminSettingsPage } from './pages/Dashboard/AdminSettingsPage';
import { useIncidentStore } from './store/useIncidentStore';
import { useAuthStore } from './store/useAuthStore';
import { OfficerInboxPage } from './pages/Officer/OfficerInboxPage';
import { DispatchDetailPage } from './pages/Officer/DispatchDetailPage';
import { MembersPage } from './pages/Officer/MembersPage';
import { AccountsPage } from './pages/Officer/AccountsPage';
import { NearbyIncidentsMapPage } from './modules/map/NearbyIncidentsMapPage';
import { SubmitIncidentWizard } from './modules/citizen/SubmitIncidentWizard';
import { MyReportsPage } from './modules/citizen/MyReportsPage';
import { CitizenReportDetailPage } from './modules/citizen/CitizenReportDetailPage';
import { FieldTasksPage } from './modules/field/FieldTasksPage';
import { CitizenHomePage } from './pages/Citizen/CitizenHomePage';
import { CitizenHelpPage } from './pages/Citizen/CitizenHelpPage';
import { CitizenAccountPage } from './pages/Citizen/CitizenAccountPage';

// Bảo vệ phân hệ Quản trị: Chưa đăng nhập -> /login | Công dân cố đổi URL -> /citizen/home
const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'citizen') {
    return <Navigate to="/citizen/home" replace />;
  }
  return children;
};

// Bảo vệ các trang Quản trị / Điều phối (chỉ officer/leader; Tổ xử lý volunteer bị chặn và đưa về /admin/field-tasks)
const RequireManager: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser } = useAuthStore();
  if (currentUser.role === 'volunteer') {
    return <Navigate to="/admin/field-tasks" replace />;
  }
  return children;
};

function getHomePathForRole(role: string): string {
  if (role === 'citizen') return '/citizen/home';
  if (role === 'volunteer') return '/admin/field-tasks';
  return '/admin/dashboard';
}

// Bảo vệ trang Login/Register: Đã đăng nhập thì điều hướng thẳng về đúng phân hệ
const GuestOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(currentUser.role)} replace />;
  }
  return children;
};

// Chuyển hướng tương thích ngược cho /dispatch/:id -> /admin/dispatch/:id
const LegacyDispatchRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/admin/dispatch/${encodeURIComponent(id)}` : '/admin/inbox'} replace />;
};

export const App: React.FC = () => {
  const { storageError, resetToDefaultData } = useIncidentStore();
  const { isAuthenticated, currentUser } = useAuthStore();

  const defaultHomePath = isAuthenticated
    ? getHomePathForRole(currentUser.role)
    : '/citizen/home';

  return (
    <BrowserRouter>
      {storageError && (
        <div className="storage-alert" role="alert">
          <span>{storageError}</span>
          <button
            onClick={() => {
              if (
                confirm(
                  'Thay thế bản lưu bằng 64 hồ sơ mẫu? Các thay đổi demo sẽ bị mất.'
                )
              ) {
                resetToDefaultData();
              }
            }}
          >
            Khôi phục mẫu
          </button>
        </div>
      )}

      <Routes>
        {/* Trang chủ mặc định: Khách & Công dân -> /citizen/home | Admin đang đăng nhập -> /admin/dashboard */}
        <Route path="/" element={<Navigate to={defaultHomePath} replace />} />

        {/* Trang đăng nhập & đăng ký (chỉ dành cho người chưa đăng nhập) */}
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />

        {/* ========================================================
            1. PHÂN HỆ CÔNG DÂN (/citizen/*) — Chuẩn URL thống nhất
            ======================================================== */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<Navigate to="/citizen/home" replace />} />
          <Route path="home" element={<CitizenHomePage />} />
          <Route path="reports" element={<MyReportsPage />} />
          <Route path="reports/:id" element={<CitizenReportDetailPage />} />
          <Route path="my-reports" element={<Navigate to="/citizen/reports" replace />} />
          <Route path="submit" element={<SubmitIncidentWizard />} />
          <Route path="map" element={<NearbyIncidentsMapPage />} />
          <Route path="help" element={<CitizenHelpPage />} />
          <Route path="account" element={<CitizenAccountPage />} />
        </Route>

        {/* ========================================================
            2. PHÂN HỆ QUẢN TRỊ & CÁN BỘ (/admin/*) — Bắt buộc quyền Admin/Cán bộ
            ======================================================== */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <DashboardLayout />
            </RequireAdmin>
          }
        >
          <Route
            index
            element={
              <Navigate
                to={currentUser.role === 'volunteer' ? '/admin/field-tasks' : '/admin/dashboard'}
                replace
              />
            }
          />
          <Route
            path="dashboard"
            element={
              <RequireManager>
                <IocDashboardPage />
              </RequireManager>
            }
          />
          <Route path="map" element={<AdminMapPage />} />
          <Route
            path="inbox"
            element={
              <RequireManager>
                <OfficerInboxPage />
              </RequireManager>
            }
          />
          <Route
            path="dispatch/:id"
            element={
              <RequireManager>
                <DispatchDetailPage />
              </RequireManager>
            }
          />
          <Route
            path="members"
            element={
              <RequireManager>
                <MembersPage />
              </RequireManager>
            }
          />
          <Route
            path="accounts"
            element={
              <RequireManager>
                <AccountsPage />
              </RequireManager>
            }
          />
          <Route path="field-tasks" element={<FieldTasksPage />} />
          <Route path="verify" element={<Navigate to="/admin/field-tasks" replace />} />
          <Route
            path="statistics"
            element={
              <RequireManager>
                <StatisticsPage />
              </RequireManager>
            }
          />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Redirect tương thích ngược các URL Admin cũ -> /admin/* (đều bị chặn bởi RequireAdmin) */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/map" element={<Navigate to="/admin/map" replace />} />
        <Route path="/inbox" element={<Navigate to="/admin/inbox" replace />} />
        <Route path="/members" element={<Navigate to="/admin/members" replace />} />
        <Route path="/accounts" element={<Navigate to="/admin/accounts" replace />} />
        <Route path="/field/tasks" element={<Navigate to="/admin/field-tasks" replace />} />
        <Route path="/statistics" element={<Navigate to="/admin/statistics" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/dispatch/:id" element={<LegacyDispatchRedirect />} />

        {/* Fallback mọi đường dẫn sai -> về đúng trang chủ theo vai trò */}
        <Route path="*" element={<Navigate to={defaultHomePath} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

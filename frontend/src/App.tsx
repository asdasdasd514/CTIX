import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { CitizenLayout } from './layouts/CitizenLayout';
import { useIncidentStore } from './store/useIncidentStore';
import { useAuthStore } from './store/useAuthStore';
import { NearbyIncidentsMapPage } from './modules/map/NearbyIncidentsMapPage';
import { SubmitIncidentWizard } from './modules/citizen/SubmitIncidentWizard';
import { MyReportsPage } from './modules/citizen/MyReportsPage';
import { CitizenReportDetailPage } from './modules/citizen/CitizenReportDetailPage';
import { CitizenHomePage } from './pages/Citizen/CitizenHomePage';
import { CitizenHelpPage } from './pages/Citizen/CitizenHelpPage';
import { CitizenAccountPage } from './pages/Citizen/CitizenAccountPage';

// Tách gói JS cho toàn bộ phân hệ Quản trị & Hiện trường (giảm ~40% dung lượng tải lần đầu cho Công dân)
const DashboardLayout = lazy(() =>
  import('./layouts/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
);
const IocDashboardPage = lazy(() =>
  import('./pages/Dashboard/IocDashboardPage').then((m) => ({ default: m.IocDashboardPage }))
);
const AdminMapPage = lazy(() =>
  import('./pages/Dashboard/AdminMapPage').then((m) => ({ default: m.AdminMapPage }))
);
const StatisticsPage = lazy(() =>
  import('./pages/Dashboard/StatisticsPage').then((m) => ({ default: m.StatisticsPage }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/Dashboard/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const OfficerInboxPage = lazy(() =>
  import('./pages/Officer/OfficerInboxPage').then((m) => ({ default: m.OfficerInboxPage }))
);
const DispatchDetailPage = lazy(() =>
  import('./pages/Officer/DispatchDetailPage').then((m) => ({ default: m.DispatchDetailPage }))
);
const MembersPage = lazy(() =>
  import('./pages/Officer/MembersPage').then((m) => ({ default: m.MembersPage }))
);
const AccountsPage = lazy(() =>
  import('./pages/Officer/AccountsPage').then((m) => ({ default: m.AccountsPage }))
);
const AdminFeedbacksPage = lazy(() =>
  import('./pages/Officer/AdminFeedbacksPage').then((m) => ({ default: m.AdminFeedbacksPage }))
);
const FieldTasksPage = lazy(() =>
  import('./modules/field/FieldTasksPage').then((m) => ({ default: m.FieldTasksPage }))
);
const FieldTaskDetailPage = lazy(() =>
  import('./modules/field/FieldTaskDetailPage').then((m) => ({ default: m.FieldTaskDetailPage }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-xs font-semibold text-slate-500">
    Đang tải giao diện...
  </div>
);

// Tự động cuộn lên đầu trang mỗi khi chuyển tab / chuyển trang (đặc biệt trên điện thoại)
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

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
      <ScrollToTop />
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

      <Suspense fallback={<PageLoader />}>
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
          <Route path="field-tasks/:id" element={<FieldTaskDetailPage />} />
          <Route path="verify" element={<Navigate to="/admin/field-tasks" replace />} />
          <Route
            path="statistics"
            element={
              <RequireManager>
                <StatisticsPage />
              </RequireManager>
            }
          />
          <Route
            path="feedbacks"
            element={
              <RequireManager>
                <AdminFeedbacksPage />
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
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

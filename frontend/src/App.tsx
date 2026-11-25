import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export const App: React.FC = () => {
  const { storageError, resetToDefaultData } = useIncidentStore();
  const { isAuthenticated, currentUser } = useAuthStore();

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
        {/* Trang đăng nhập & đăng ký */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ========================================================
            1. PHÂN HỆ CÔNG DÂN (Cho phép khách chưa đăng nhập vẫn xem & gửi phản ánh)
            ======================================================== */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenHomePage />} />
          <Route path="home" element={<CitizenHomePage />} />
          <Route path="reports" element={<MyReportsPage />} />
          <Route path="reports/:id" element={<CitizenReportDetailPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          <Route path="submit" element={<SubmitIncidentWizard />} />
          <Route path="map" element={<NearbyIncidentsMapPage />} />
          <Route path="help" element={<CitizenHelpPage />} />
          <Route path="account" element={<CitizenAccountPage />} />
        </Route>

        {/* ========================================================
            2. PHÂN HỆ ADMIN & CÁN BỘ (Officer Portal)
            ======================================================== */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : currentUser.role === 'citizen' ? (
              <Navigate to="/citizen/home" replace />
            ) : (
              <DashboardLayout />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<IocDashboardPage />} />
          <Route path="admin" element={<IocDashboardPage />} />
          <Route path="admin/dashboard" element={<IocDashboardPage />} />

          <Route path="map" element={<AdminMapPage />} />
          <Route path="admin/map" element={<AdminMapPage />} />

          <Route path="inbox" element={<OfficerInboxPage />} />
          <Route path="admin/inbox" element={<OfficerInboxPage />} />

          <Route path="members" element={<MembersPage />} />
          <Route path="admin/members" element={<MembersPage />} />

          <Route path="accounts" element={<AccountsPage />} />
          <Route path="admin/accounts" element={<AccountsPage />} />

          <Route path="dispatch/:id" element={<DispatchDetailPage />} />
          <Route path="admin/dispatch/:id" element={<DispatchDetailPage />} />

          <Route path="field/tasks" element={<FieldTasksPage />} />
          <Route path="admin/verify" element={<FieldTasksPage />} />

          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

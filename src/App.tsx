import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Auth/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { CitizenLayout } from "./layouts/CitizenLayout";
import { IocDashboardPage } from "./pages/Dashboard/IocDashboardPage";
import { AdminMapPage } from "./pages/Dashboard/AdminMapPage";
import { StatisticsPage } from "./pages/Dashboard/StatisticsPage";
import { useIncidentStore } from "./store/useIncidentStore";
import { OfficerInboxPage } from "./pages/Officer/OfficerInboxPage";
import { DispatchDetailPage } from "./pages/Officer/DispatchDetailPage";
import { NearbyIncidentsMapPage } from "./modules/map/NearbyIncidentsMapPage";
import { SubmitIncidentWizard } from "./modules/citizen/SubmitIncidentWizard";
import { MyReportsPage } from "./modules/citizen/MyReportsPage";
import { FieldTasksPage } from "./modules/field/FieldTasksPage";
import { CitizenHomePage } from "./pages/Citizen/CitizenHomePage";
import { CitizenHelpPage } from "./pages/Citizen/CitizenHelpPage";

export const App: React.FC = () => {
  const { storageError, resetToDefaultData } = useIncidentStore();
  return (
    <BrowserRouter>
      {storageError && (
        <div className="storage-alert" role="alert">
          <span>{storageError}</span>
          <button
            onClick={() => {
              if (
                confirm(
                  "Thay thế bản lưu bằng 64 hồ sơ mẫu? Các thay đổi demo sẽ bị mất.",
                )
              )
                resetToDefaultData();
            }}
          >
            Khôi phục mẫu
          </button>
        </div>
      )}
      <Routes>
        {/* Trang đăng nhập */}
        <Route path="/login" element={<LoginPage />} />

        {/* ========================================================
            1. PHÂN HỆ CÔNG DÂN (Citizen Portal - Top Navigation Bar)
            4 Mục: Trang chủ / Phản ánh / Bản đồ / Trợ giúp
            ======================================================== */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenHomePage />} />
          <Route path="home" element={<CitizenHomePage />} />
          {/* Mục "Phản ánh": Hiển thị danh sách tất cả phản ánh + Nút Thêm phản ánh */}
          <Route path="reports" element={<MyReportsPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          {/* Trang form thêm phản ánh 2 bước */}
          <Route path="submit" element={<SubmitIncidentWizard />} />
          {/* Mục "Bản đồ" */}
          <Route path="map" element={<NearbyIncidentsMapPage />} />
          {/* Mục "Trợ giúp" */}
          <Route path="help" element={<CitizenHelpPage />} />
        </Route>

        {/* ========================================================
            2. PHÂN HỆ ADMIN & CÁN BỘ (Officer Portal - Left IRS Sidebar)
            Sidebar dọc chuẩn IRS màu Dark Navy #0b132b, la bàn xoay
            ======================================================== */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Mặc định mở Bản đồ phản ánh cho cán bộ */}
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="map" element={<AdminMapPage />} />
          <Route path="admin/map" element={<AdminMapPage />} />

          {/* Tiếp nhận & phân công (giữ đầy đủ đường dẫn cũ) */}
          <Route path="dashboard" element={<IocDashboardPage />} />
          <Route path="admin" element={<IocDashboardPage />} />
          <Route path="admin/dashboard" element={<IocDashboardPage />} />
          <Route path="inbox" element={<OfficerInboxPage />} />
          <Route path="admin/inbox" element={<OfficerInboxPage />} />

          {/* Chi tiết & phân công hồ sơ */}
          <Route path="dispatch/:id" element={<DispatchDetailPage />} />
          <Route path="admin/dispatch/:id" element={<DispatchDetailPage />} />

          {/* Thống kê */}
          <Route path="statistics" element={<StatisticsPage />} />

          {/* Nhiệm vụ hiện trường */}
          <Route path="field/tasks" element={<FieldTasksPage />} />
          <Route path="admin/verify" element={<FieldTasksPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Auth/LoginPage";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { CitizenLayout } from "./layouts/CitizenLayout";
import { OfficerWorkbench } from "./pages/Dashboard/IocDashboardPage";
import { StatisticsPage } from "./pages/Dashboard/StatisticsPage";
import { useIncidentStore } from "./store/useIncidentStore";
import { IocDashboardPage } from "./pages/Dashboard/IocDashboardPage";
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
          {/* Màn hình 1 trong ảnh: Bảng Điều Hành Tổng Thể & Giám Sát Phản Ánh Đô Thị */}
          <Route index element={<IocDashboardPage />} />
          <Route path="dashboard" element={<IocDashboardPage />} />
          <Route path="admin" element={<IocDashboardPage />} />
          <Route path="admin/dashboard" element={<IocDashboardPage />} />

          {/* Màn hình 2 trong ảnh: 04 - Tiếp nhận & Phân công phản ánh (Desktop Cán Bộ) */}
          <Route path="inbox" element={<OfficerInboxPage />} />
          <Route path="admin/inbox" element={<OfficerInboxPage />} />

          {/* Màn hình 3 trong ảnh: 05 - Phân công & Điều phối xử lý sự cố (Chi tiết 2 cột) */}
          <Route path="dispatch/:id" element={<DispatchDetailPage />} />
          <Route path="admin/dispatch/:id" element={<DispatchDetailPage />} />

          {/* Bản đồ số không gian đô thị */}
          <Route path="map" element={<OfficerWorkbench initialView="map" />} />
          <Route
            path="admin/map"
            element={<OfficerWorkbench initialView="map" />}
          />
          <Route path="statistics" element={<StatisticsPage />} />

          {/* Đội thanh niên tình nguyện: Xác minh tại chỗ & Nghiệm thu Trước/Sau */}
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

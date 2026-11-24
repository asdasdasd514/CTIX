import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Auth/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CitizenLayout } from './layouts/CitizenLayout';
import { IocDashboardPage } from './pages/Dashboard/IocDashboardPage';
import { OfficerInboxPage } from './pages/Officer/OfficerInboxPage';
import { DispatchDetailPage } from './pages/Officer/DispatchDetailPage';
import { NearbyIncidentsMapPage } from './modules/map/NearbyIncidentsMapPage';
import { SubmitIncidentWizard } from './modules/citizen/SubmitIncidentWizard';
import { MyReportsPage } from './modules/citizen/MyReportsPage';
import { CitizenReportDetailPage } from './modules/citizen/CitizenReportDetailPage';
import { FieldTasksPage } from './modules/field/FieldTasksPage';
import { CitizenHomePage } from './pages/Citizen/CitizenHomePage';
import { CitizenHelpPage } from './pages/Citizen/CitizenHelpPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
          {/* Mục "Phản ánh": Hiển thị danh sách tất cả phản ánh + Trang chi tiết riêng */}
          <Route path="reports" element={<MyReportsPage />} />
          <Route path="reports/:id" element={<CitizenReportDetailPage />} />
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
          <Route path="map" element={<NearbyIncidentsMapPage />} />
          <Route path="admin/map" element={<NearbyIncidentsMapPage />} />

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

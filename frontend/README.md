# CTIX — Citizen & City Incident eXchange
## Hệ Thống Tiếp Nhận & Giám Sát Phản Ánh Hiện Trường Đô Thị Thông Minh
**Đề bài 2 — Hackathon 2026 • Đồng Nai**

CTIX là nền tảng web hiện đại kết nối trực tiếp **Người dân (Công dân)** và **Chính quyền (UBND & Trung tâm Điều hành IOC)**, số hóa toàn diện quy trình phản ánh sự cố đô thị (chiếu sáng, ngập lụt, rác thải, hạ tầng giao thông).

---

## 🌟 Tính Năng Nổi Bật

### 1. 👤 Cổng Dịch Vụ Công Dân (Citizen Portal)
- **Thanh Điều Hướng Trên Cùng (Top Navigation)** chuẩn 4 mục:
  - `🏠 Trang chủ`: Tin tức đô thị, số liệu giải quyết, cảnh báo khẩn từ UBND Đồng Nai.
  - `📋 Phản ánh`: Danh sách tất cả phản ánh trên địa bàn + Nút `+ Thêm Phản Ánh Mới` nổi bật + Xem ảnh Trước/Sau + Chấm điểm hài lòng 5 sao.
  - `🗺️ Bản đồ`: Bản đồ số hiện trường trực quan với nút `+1 Upvote` đồng thuận sự cố.
  - `❓ Trợ giúp`: Hướng dẫn quy trình 4 bước, câu hỏi thường gặp (FAQ) và danh bạ đường dây nóng khẩn cấp.
- **Quy Trình Gửi Phản Ánh Tinh Gọn 2 Bước**:
  - **Bước 1**: Tải ảnh hiện trường thật từ máy tính/điện thoại (xem trước tức thì) + Chọn danh mục + Điền ghi chú + Số điện thoại.
  - **Bước 2**: Bản đồ OpenStreetMap tương tác:
    - Nút **`[📍 Lấy vị trí hiện tại (GPS)]`** 1 chạm.
    - Lia map & nhấp vào bất cứ điểm nào để đặt ghim.
    - Tự động nhận diện tên đường qua Reverse Geocoding.
- **Tiện ích trợ năng**: Nút phóng to **`👓 Chữ Lớn`** cho người cao tuổi.

### 2. 🏛️ Bàn Làm Việc Cán Bộ & Trung Tâm IOC (Admin Portal)
- **Sidebar IRS Chuyên Nghiệp**:
  - Màu nền Dark Navy `#0b132b`, thu nhỏ `w-20` và mở rộng `w-64`.
  - **La bàn định hướng kim xoay 360 độ liên tục** (`AnimatedCompass`).
  - **Vạch phát sáng trắng cạnh trái** nhận diện mục đang mở.
- **Màn hình 01**: Bảng điều hành tổng thể IOC (4 thẻ KPI, Bản đồ OpenStreetMap trung tâm, BXH thi đua 30 địa bàn, Sự cố khẩn cấp).
- **Màn hình 04**: Bàn làm việc cán bộ tiếp nhận (Lọc hồ sơ theo danh mục, cảnh báo hạn xử lý SLA 24h/48h đếm ngược).
- **Màn hình 05**: Phân công & Điều phối xử lý sự cố (Giao việc cho 3 đội tiếp ứng trực ban, thiết lập SLA, gửi Zalo/SMS điều động).
- **Nghiệm thu Before - After**: Đối soát ảnh hiện trường trước và sau thi công của Đội thanh niên tình nguyện.

### 3. 🗺️ Bản Đồ Số Đa Nguồn (Multi-Layer OpenStreetMap)
- Tích hợp chuẩn **OpenStreetMap** qua nguồn CartoDB Voyager tốc độ cao, không bị nghẽn mạng hay lỗi DNS.
- Hỗ trợ chuyển đổi nhanh giữa:
  - **`🗺️ Đường sá`**: Bản đồ đô thị tiếng Việt chi tiết.
  - **`🛰️ Vệ tinh`**: Ảnh vệ tinh độ phân giải cao ESRI World Imagery.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend Core**: React 19, TypeScript
- **Bundler & Build Tool**: Vite 8
- **Styling**: Tailwind CSS
- **Mapping & GIS**: Leaflet, OpenStreetMap, CartoDB Voyager, ESRI Satellite, Nominatim API
- **State Management**: Zustand (kèm LocalStorage persist)
- **Routing**: React Router DOM v7
- **Iconography**: Lucide React

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Dev Server)
npm run dev

# 3. Biên dịch bản sản xuất (Production Build)
npm run build
```

Mở trình duyệt truy cập:
- `http://localhost:5173/citizen/home` (Cổng Người Dân)
- `http://localhost:5173/dashboard` (Bàn Điều Hành IOC Cán Bộ)

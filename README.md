# CTIX — Trấn Biên SmartCity (Full-Stack)

Nền tảng tiếp nhận, điều phối, theo dõi và nghiệm thu phản ánh hiện trường đô thị cho **UBND Phường Trấn Biên, TP. Biên Hòa, Đồng Nai**.

## Cấu trúc thư mục

```text
CTIX/
├── frontend/     # React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Leaflet
└── backend/      # Node.js + Express + TypeScript + MongoDB Atlas (Mongoose) + Cloudinary + JWT
```

## 5 Module Chức Năng Chính
- **`[MOD-01]` Citizen Intake:** Công dân gửi phản ánh, nhập mô tả (hỗ trợ giọng nói), tải nhiều ảnh hiện trường lên Cloudinary, chọn vị trí GPS/bản đồ, chỉnh sửa/hủy hồ sơ.
- **`[MOD-02]` Tracking & Feedback:** Theo dõi tiến trình giải quyết 4 bước, thời gian hoàn thành và đánh giá hài lòng 1–5 sao.
- **`[MOD-03]` Smart City GIS Map:** Bản đồ số hiển thị điểm sự cố (GeoJSON `2dsphere`), phân quyền hiển thị giữa Công dân và Cán bộ.
- **`[MOD-04]` Officer Dispatch:** Hàng đợi tiếp nhận, phân công nhân lực theo Cá nhân / Tổ đội, quản lý Thành viên & Nhóm, Dashboard & Thống kê.
- **`[MOD-05]` Field Resolution & Audit:** Xác minh hiện trường, tải ảnh sau xử lý lên Cloudinary, nghiệm thu hoàn tất và lưu nhật ký kiểm toán.

## Hướng dẫn chạy Local

### 1. Chạy Backend (`http://localhost:4000`)
```bash
cd backend
cp .env.example .env   # Điền MONGODB_URI và thông số Cloudinary
npm install
npm run seed           # Nạp 64 hồ sơ mẫu + 5 tổ đội + 10 thành viên + tài khoản demo
npm run dev
```

### 2. Chạy Frontend (`http://localhost:5173`)
```bash
cd frontend
npm install
npm run dev
```

> **Lưu ý khi Deploy Vercel:** Đặt **Root Directory** của dự án Frontend là `frontend` và thêm biến môi trường `VITE_API_URL=https://<domain-backend-cua-ban>/api`.

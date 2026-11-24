# CTIX — Phản ánh hiện trường

Bản demo cho Đề 2, Hackathon Đồng Nai 2026, dữ liệu giả lập tại Phường Trấn Biên.

## Chạy và kiểm tra

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

Kiểm thử logic dùng Node 22.22+ và bộ chuyển TypeScript Sucrase đã có trong cây phụ thuộc của dự án. Không cần cài thêm thư viện cho ứng dụng.

## Các màn hình

- `/dashboard` hoặc `/inbox`: bàn làm việc, bộ lọc việc cần làm, danh sách và bản đồ cùng chọn một hồ sơ, giao loại/đơn vị/mức độ/hạn/ghi chú.
- `/map`: bản đồ phản ánh và cùng bộ công cụ điều phối.
- `/dispatch/:id`: chi tiết đúng hồ sơ; ID sai hiện không tìm thấy, không mở hồ sơ khác.
- `/field/tasks`: xác minh, nhận việc, ảnh sau xử lý và công khai kết quả.
- `/statistics`: thống kê được tính từ hồ sơ, lọc theo tháng tiếp nhận.
- `/citizen/submit`: gửi phản ánh 3 bước: ảnh → vị trí → loại và mô tả.
- `/citizen/reports`: theo dõi tiến độ, ảnh trước/sau và đánh giá từ 1–5 sao. Bộ lọc “của tôi” dùng số điện thoại tài khoản demo.
- `/citizen/map`: bản đồ công khai và đồng phản ánh.

## Demo realtime trên một máy

1. Mở `/dashboard`, dùng “Mở tab người dân” và “Mở tab hiện trường”.
2. Các tab phải cùng origin: cùng protocol, host và port, cùng hồ sơ trình duyệt. Không trộn `localhost` với `127.0.0.1` hoặc chế độ ẩn danh.
3. Người dân chọn ảnh thật hoặc ảnh minh họa được ghi rõ, ghim vị trí, nhập địa chỉ và gửi.
4. Cán bộ thấy hồ sơ mới không cần tải lại; chọn đúng hồ sơ, đơn vị, hạn và ghi chú để giao.
5. Hiện trường nhận và bắt đầu, thêm ảnh sau cùng nội dung khắc phục, hoàn tất. Người dân xem ảnh và đánh giá.

Zustand giữ UI, localStorage lưu dữ liệu và sự kiện `storage` cập nhật các tab khác. Vai trò demo được giữ riêng trong sessionStorage từng tab. Đây chưa phải xác thực/phân quyền máy chủ hoặc realtime nhiều thiết bị. localStorage không có giao dịch; không dùng cho nhiều người ghi đồng thời.

## Bản đồ và dữ liệu

- Leaflet, nền đường phố Esri World Street Map và vệ tinh Esri World Imagery; attribution giữ trên bản đồ. Nguồn Esri được chọn vì trên máy thử, `tile.openstreetmap.org` không phân giải DNS và nguồn CARTO cũ trả watermark yêu cầu key.
- Ghim giữ theo ID. Lọc/chọn/nhận cập nhật không tự kéo tâm hoặc dựng lại mọi marker. Chỉ “Về điểm đã chọn”, GPS và thao tác người dùng mới đổi góc xem.
- Các vị trí mẫu được dựng để minh họa, chưa phải tọa độ hiện trường đã xác minh. Hồ sơ mới lấy tọa độ được người dùng ghim.
- GPS thất bại báo lỗi, không ghi tọa độ trung tâm phường thành vị trí GPS.
- Mất nền bản đồ vẫn có danh sách; nút thử lại tải lại nền. Bản đồ cần mạng, không có chế độ tải bản đồ offline.
- Mẫu mới: 64 hồ sơ, 47 đã xử lý, đèn 18/ngập 15/rác 21/mặt đường 10; trung bình 3,2 ngày từ timestamps mẫu. Bản lưu cũ được giữ, không tự reset.
- Khôi phục mẫu thay thế dữ liệu demo trên origin hiện tại, luôn có xác nhận. Không khôi phục nếu muốn giữ hồ sơ vừa nhập.
- Ảnh tải vào được thu nhỏ trước khi lưu; lỗi dung lượng phải báo chưa lưu, không báo thành công giả.
- Gộp trùng trong 50 m chỉ thực hiện khi người gửi xác nhận, giữ ảnh và thông tin gửi bổ sung; không tự tăng mức khẩn cấp.
- Không tích hợp gửi Zalo/SMS hoặc mô hình AI trong bản demo này.

Nguồn dịch vụ: [Esri World Street Map](https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer), [CARTO API key](https://carto.com/basemaps/apikey/), [MDN storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event).

Nghiên cứu và kết quả kiểm thử được lưu trong `docs/`.

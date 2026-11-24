# Kiểm thử admin và lỗi ghim bản đồ — 24/11/2026

## Kết quả tự động

- `npm run build`: thành công.
- `npm test`: 6/6 nhóm kiểm thử thành công. Bao gồm seed 64/47 và 4 loại; dữ liệu lưu hỏng/trống/ảnh không an toàn; chuyển trạng thái và ghi chú phân công; gộp trùng có xác nhận; cập nhật storage và hết dung lượng; hồi quy làm tròn hạn xử lý.
- `npm run lint`: không lỗi, còn 13 cảnh báo unused ở các file cũ ngoài phần viết lại. Không coi đây là lint hoàn toàn sạch.
- `git diff --check`: không lỗi khoảng trắng.
- Build còn cảnh báo bundle JavaScript >500 kB; chưa thêm chia bundle vì không phải nguyên nhân lỗi bản đồ.
- Kiểm tra giao diện Impeccable: giữ font hệ thống cho trang thao tác cán bộ (Operate); đã bỏ bounce trong phần theo dõi phản ánh.

## Lỗi người dùng báo: các chấm bản đồ nhảy

Tái hiện trên trình duyệt tại `/dashboard`: chọn hồ sơ khiến `.leaflet-map-pane` đổi từ `translate3d(0px, 0px, 0px)` sang `translate3d(-39px, 125px, 0px)`. Nguyên nhân đã xác nhận là gọi panTo khi chọn hồ sơ. Ngoài ra, effect cũ xóa và tạo lại toàn bộ marker mỗi khi nhận mảng lọc mới; mảng này trước đó được tạo lại mỗi render.

Đã sửa ở component bản đồ dùng chung:

- Giữ marker theo incident.id, thêm/xóa đúng phần thay đổi; chỉ setLatLng khi tọa độ thực sự đổi.
- Ghim đang chọn chỉ đổi highlight; popup không tự pan. Chỉ nút “Về điểm đã chọn”, GPS hoặc thao tác người dùng mới đổi góc xem.
- Tắt animation zoom của marker để không có chuyển động rời nền bản đồ.
- Giữ mảng lọc bằng useMemo tại bàn làm việc.
- Ghim chọn vị trí được cập nhật tại chỗ; nhập địa chỉ hoặc click bản đồ không tự kéo điểm về tâm.
- Giữ gutter thanh cuộn để nội dung dài không làm đổi bề rộng đột ngột.
- Hủy listener storage cũ khi HMR thay module trong quá trình phát triển.

## Kiểm thử trình duyệt đã thực hiện

Dùng công cụ CUA, thao tác giao diện và assert dữ liệu DOM, không sửa localStorage bằng console để giả kết quả.

1. Nền Esri đường phố tải ảnh thật: các tile kiểm tra có naturalWidth=256. Nguồn OSM Standard trên máy thử báo lỗi DNS; nguồn CARTO cũ thiếu key. Đổi nền vệ tinh hoạt động và giữ góc xem.
2. Chọn liên tiếp hồ sơ TB-2026-063 và TB-2026-052: cả 17 marker giữ nguyên transform và tâm bản đồ không đổi.
3. Lọc rác thải: còn 5 marker; từng marker giữ transform khớp với tập trước lọc.
4. Zoom vào/ra và nút “Về điểm đã chọn”: hoạt động; di chuyển tâm chỉ xảy ra khi chủ động bấm nút định vị.
5. Đồng phản ánh tại tab người dân: tab admin nhận cập nhật; tâm và transform của các marker đang hiển thị không đổi.
6. Ghim thủ công lệch tâm trên form người dân rồi nhập địa chỉ: chỉ có 1 marker và tâm bản đồ không đổi.
7. Luồng 3 tab: gửi → admin thấy không reload → giao đơn vị/hạn/ghi chú → hiện trường nhận/bắt đầu → ảnh sau + nội dung → người dân xem và đánh giá 2 sao. Nội dung và đánh giá mới cập nhật giữa các tab.
8. Thiếu ảnh sau: nút hoàn tất bị vô hiệu hóa. ID không tồn tại: hiện không tìm thấy, không mở nhầm hồ sơ đầu.
9. Trình duyệt trang admin cuối không ghi nhận console error qua công cụ kiểm tra.

Hồ sơ TB-2026-065 có mô tả bắt đầu bằng “KIỂM THỬ CTIX”, được tạo trong phiên trình duyệt thử để kiểm chứng luồng; không tự reset bộ dữ liệu của người dùng.

## Cách kiểm tra lại lỗi ghim

1. Tải lại `/dashboard` sau khi cập nhật mã, chọn hai hồ sơ khác nhau trong danh sách.
2. Các ghim không tự chạy vị trí và bản đồ không kéo tâm theo lựa chọn.
3. Chuyển bộ lọc loại sự cố rồi bỏ lọc; ghim còn lại giữ tọa độ.
4. Mở tab người dân cùng origin, gửi phản ánh hoặc đồng phản ánh; tab admin cập nhật mà không kéo bản đồ.
5. Bấm “Về điểm đã chọn” để chủ động đưa đúng ghim về giữa.

## Chưa xác nhận

- Chưa kiểm thử trên điện thoại thật. Công cụ browser viewport đã nhận lệnh đổi kích thước nhưng DOM vẫn báo chiều rộng desktop; không ghi nhận mobile là đã pass. Chụp ảnh trình duyệt cuối qua công cụ trả lỗi, nên không có ảnh chụp cuối để đính kèm.
- Không thử cấp quyền GPS thật, không tải tệp cá nhân của người dùng để thử upload. Logic ảnh đã kiểm tra kiểu/dung lượng và thu nhỏ trước khi lưu; ảnh minh họa có nhãn rõ trong demo.
- Chưa có backend, xác thực/phân quyền máy chủ, đồng bộ nhiều máy hoặc xử lý ghi đồng thời. Tọa độ seed vẫn là vị trí giả lập, không phải điểm hiện trường đã khảo sát.

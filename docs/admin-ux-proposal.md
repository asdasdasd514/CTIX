# T02THAI — Đề xuất tối ưu trang cán bộ cho Đề 2

Ngày nghiên cứu: 24/11/2026. Phạm vi: nghiên cứu và đề xuất; chưa sửa ứng dụng.
Đã thống nhất: ưu tiên demo realtime cho bài thi, đồng bộ các tab cùng trình duyệt trên cùng máy.

## 1. Căn cứ và mục tiêu

Đề thi `/home/rushi/Downloads/T02-Ctix (1).pdf`, trang 1–3:

- Vòng sơ loại yêu cầu thiết kế và luồng sử dụng; chưa yêu cầu lập trình hoàn chỉnh. Phương án cần có thể hiện thực trong 24 giờ.
- Đề 2 tập trung vào người dân, cán bộ tiếp nhận phường và thanh niên tình nguyện hỗ trợ xác minh.
- Các màn hình bắt buộc gồm gửi phản ánh 3 bước: ảnh → vị trí → loại; theo dõi của tôi; bản đồ quanh tôi; cán bộ tiếp nhận, phân loại, giao xử lý, hạn xử lý; cập nhật kết quả kèm ảnh; đánh giá hài lòng.
- Điểm cộng: gợi ý loại bằng AI, gộp phản ánh trùng vị trí, chữ lớn.
- Mẫu ban đầu: 64 phản ánh, gồm đèn đường 18, ngập 15, rác 21, mặt đường 10; 47 đã xử lý; thời gian trung bình 3,2 ngày. Đây là dữ liệu mẫu, không phải quy định thời hạn xử lý.
- Chấm điểm: hiểu người dùng 25, UX/UI 30, sáng tạo 20, khả thi/tác động 25. Nếu bằng điểm, ưu tiên UX/UI rồi khả thi.
- Bài nộp cần PDF giao diện và thuyết minh tối đa 3 trang; prototype được khuyến khích. Cần ghi rõ việc dùng AI. Báo cáo này là ghi chú nội bộ, không thay thế thuyết minh.

Mục tiêu trang cán bộ: biết việc nào cần làm trước, mở đúng hồ sơ, giao đúng bộ phận với hạn cụ thể, theo dõi kết quả và công khai ảnh sau xử lý.

## 2. Những vấn đề đã xác nhận

| Vấn đề | Bằng chứng | Hướng sửa |
|---|---|---|
| Nền bản đồ hiện watermark yêu cầu khóa | Ảnh người dùng; URL CARTO không có key trong `src/components/Map/OpenStreetMap.tsx` | Bản demo dùng OSM Standard đúng chính sách; hoặc CARTO với khóa hợp lệ nếu có sẵn. Không coi HTTP 200 là đủ vì ảnh tile có thể là watermark |
| Số liệu khó tin cậy vì trộn nhiều phạm vi | `src/pages/Dashboard/IocDashboardPage.tsx:48`, `:65`, `:83`, `:101`, `:153` có số viết cố định | Chỉ dùng một phạm vi phường/tháng; tính từ hồ sơ đang có |
| Thiếu lọc mặt đường trên dashboard | `src/pages/Dashboard/IocDashboardPage.tsx:22` | Đủ 4 loại theo đề |
| Popup mở sẵn hồ sơ đầu | `src/pages/Dashboard/IocDashboardPage.tsx:138` | Chỉ mở khi chọn; chọn theo ID |
| Chi tiết bản đồ giữ bản sao hồ sơ | `src/modules/map/NearbyIncidentsMapPage.tsx:25` | Lưu selectedId, lấy hồ sơ mới nhất từ store; xử lý khi bộ lọc ẩn hồ sơ |
| Đường dẫn sai có thể dẫn đến phân công nhầm | `src/pages/Officer/DispatchDetailPage.tsx`, biểu thức `find(...) || incidents[0]` | Hiện không tìm thấy, vô hiệu hóa thao tác |
| Luồng demo nhiều tab chưa được nối | `src/store/useIncidentStore.ts` chỉ lưu localStorage và cập nhật Zustand trong tab hiện tại | Nghe sự kiện storage, đọc/kiểm tra dữ liệu trước khi cập nhật store |
| Danh sách bị cắt nhưng phân trang không hoạt động | `src/pages/Officer/OfficerInboxPage.tsx:178`, `:280` | Phân trang thật hoặc hiển thị toàn bộ 64 mục cho MVP; số đếm theo kết quả lọc |
| Thời gian, quá hạn và thông báo có số viết cố định | `src/pages/Officer/OfficerInboxPage.tsx:73`, `:76`, `:195`; `src/pages/Officer/DispatchDetailPage.tsx` | Tính từ timestamps/deadline; thống nhất múi giờ hiển thị |
| Thông báo đã gửi Zalo/SMS dù chỉ gọi alert | `src/pages/Officer/DispatchDetailPage.tsx`, `handleConfirmDispatch` | Bỏ tuyên bố gửi thật; nếu giữ minh họa phải ghi mô phỏng |
| Form gửi đang có 2 bước | `src/modules/citizen/SubmitIncidentWizard.tsx:80` | Đợt tiếp theo đưa về đúng 3 bước của đề, sau phần admin |

## 3. Cấu trúc trang đề xuất

Giữ màu xanh/navy và các thành phần hiện có, tập trung thay bố cục và hành vi. Không cần dựng lại toàn ứng dụng.

- Menu: **Bàn làm việc · Bản đồ phản ánh · Nhiệm vụ hiện trường · Thống kê**. Bỏ số màn 01/04/05, tiếng Anh Before–After và nhãn kỹ thuật khỏi luồng cán bộ.
- Đầu trang: “Bàn làm việc — Phường Trấn Biên”, phạm vi tháng, tìm mã/địa chỉ, nhãn “Dữ liệu demo”, thời điểm cập nhật gần nhất.
- Bốn ô việc: **Chờ phân công · Đang xử lý · Quá hạn · Đã xử lý**. Bấm ô để lọc. Khẩn cấp là bộ lọc riêng; không cộng các nhóm giao nhau thành tổng.
- Vùng chính desktop: danh sách khoảng 40%, bản đồ khoảng 60%. Chọn dòng hoặc ghim cùng chọn một hồ sơ; khung chi tiết có loại, mức độ, ảnh, hạn và nút hành động phù hợp trạng thái.
- Thẻ phân công: loại sự cố có thể sửa, đơn vị phụ trách, hạn ngày/giờ, ghi chú. Gợi ý đơn vị theo loại, cán bộ quyết định. Không mặc định đội CSGT cho mọi loại sự cố.
- Bảng thi đua liên phường và biểu đồ lớn chuyển ra khỏi màn làm việc chính. Thống kê dùng cùng dữ liệu, không dùng số phóng đại để trang trông đầy.
- Mobile: danh sách trước, nút chuyển “Danh sách / Bản đồ”; chi tiết một cột, nút chính dễ chạm, không ép hai cột desktop vào màn nhỏ.
- Chữ nội dung 14–16 px, mục tiêu chạm khoảng 44 px trở lên; hỗ trợ bàn phím, focus rõ, chữ lớn; trạng thái có chữ/icon cùng màu. Bỏ chuyển động la bàn và nhấp nháy liên tục không phục vụ công việc.

## 4. Bản đồ phải hỗ trợ tình huống thực tế

1. Bộ lọc loại, trạng thái và hạn dùng chung với danh sách; mặc định ưu tiên việc chưa xong. Hiện rõ “đang hiển thị X/Y hồ sơ”.
2. Ghép cụm ghim theo mức zoom để tránh chồng; khác với gộp hồ sơ nghiệp vụ. Với 64 hồ sơ, ưu tiên tương tác chọn/lọc đúng trước, ghép cụm sau nếu vẫn khó đọc.
3. Marker biểu thị trạng thái, icon biểu thị loại; khẩn cấp/quá hạn có ký hiệu và nhãn, không dùng một màu xanh cho cả rác thải lẫn đã hoàn thành.
4. Popup chỉ có thông tin tóm tắt và một hành động; nội dung từ người dùng phải render an toàn, tránh nội suy trực tiếp thành HTML.
5. Hồ sơ mới: thông báo nhẹ “Có 1 phản ánh mới”, cập nhật số đếm và ghim; không tự kéo bản đồ hoặc đóng form đang nhập. Bấm thông báo mới đưa đến hồ sơ.
6. Giao xử lý: cả tab cán bộ và hiện trường thấy đơn vị/hạn mới; popup và panel đang mở không giữ trạng thái cũ.
7. GPS bị từ chối: báo rõ chưa lấy được vị trí, cho chọn bằng tay. Không ghi tọa độ trung tâm phường thành vị trí GPS thành công.
8. Tile lỗi/mất mạng: thông báo và nút thử lại; danh sách và tọa độ vẫn dùng được. Không tuyên bố nền bản đồ hoạt động offline nếu chưa có nguồn hợp lệ.
9. Tìm không thấy/không có kết quả lọc: chỉ dẫn xóa bộ lọc; tọa độ không hợp lệ: báo lỗi thay vì làm hỏng toàn bản đồ.

## 5. Realtime demo tối thiểu

Giữ React + Zustand + Leaflet. Tận dụng localStorage hiện có, bổ sung đồng bộ qua `storage` event giữa các tab cùng origin. Tab ghi cập nhật Zustand trực tiếp; các tab khác nhận sự kiện và nạp dữ liệu đã kiểm tra. Không cần thêm thư viện hoặc backend cho bước này.

Nguồn chính thức: [MDN — storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event): sự kiện chạy ở các tab khác cùng origin, không chạy ở chính tab vừa ghi.

- Ba tab demo: người dân → cán bộ → hiện trường. Cùng protocol/host/port và cùng hồ sơ trình duyệt.
- Nhãn “Demo đồng bộ trên máy này”; không hiển thị “kết nối máy chủ” khi chưa có máy chủ.
- Kiểm tra dữ liệu nạp từ storage, báo lỗi khi lưu thất bại; giới hạn/nén ảnh đầu vào để tránh vượt dung lượng. Không báo thành công nếu chưa lưu được.
- Trước mỗi mutation đọc trạng thái mới nhất và kiểm tra hồ sơ/trạng thái; thao tác đã được người khác thực hiện thì yêu cầu xem lại. localStorage không có giao dịch, vẫn giới hạn trình diễn thao tác tuần tự; không cam kết giải quyết ghi đồng thời.
- Các vai trò demo theo tab phải độc lập; tránh đồng bộ đổi vai trò làm cả ba tab đổi tài khoản.
- Nếu sau này triển khai nhiều thiết bị: cần backend, lưu ảnh, xác thực và kiểm quyền phía máy chủ, giao dịch/version và subscription; không coi localStorage là phân quyền thật.

Nguồn bản đồ: [CARTO — API key](https://carto.com/basemaps/apikey/) xác nhận phải thêm khóa vào tile URL để bỏ watermark. Phương án ít phụ thuộc tài khoản cho demo: [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/), URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, giữ attribution, Referer và cache mặc định; không tải hàng loạt hoặc tải trước để dùng offline. Dịch vụ cộng đồng không bảo đảm SLA.

## 6. Luồng và dữ liệu

Luồng chuẩn: **Mới → Đã giao → Đang xử lý → Đã xử lý → Đã đánh giá**. Xác minh của thanh niên là bằng chứng bổ sung, không tự thay thế việc giao xử lý. Cần nút bắt đầu xử lý; ảnh sau và ghi chú phải có trước khi công khai kết quả. Không mở rộng thêm vòng duyệt bắt buộc nếu đề không cần.

Gộp trùng: cùng loại + gần vị trí là gợi ý; cán bộ xem và xác nhận, giữ liên kết từng người gửi/ảnh. Không tự tăng lên khẩn cấp chỉ vì nhiều lượt phản ánh; mức độ do nguy cơ và xác nhận của cán bộ quyết định.

Seed cần cố định và có thể tái lập: 64 tổng, 47 xử lý, 17 chưa xong; đúng 4 nhóm 18/15/21/10. 3,2 ngày tính từ timestamps mẫu nhất quán, không chỉ viết lên UI. Khi thao tác demo, số liệu thay đổi theo dữ liệu. Nút khôi phục mẫu cần cảnh báo mất thay đổi demo, không tự reset khi nạp phiên bản mới.

Không gọi 47/64 là tỷ lệ đúng hạn: đó là tỷ lệ đã xử lý (~73,4%). Đúng hạn phải có deadline và thời điểm hoàn thành; hồ sơ thiếu căn cứ không được tự tính là đúng hạn. Điểm hài lòng chỉ tính các đánh giá thực sự có; không có đánh giá thì hiện chưa có dữ liệu.

## 7. Liên hệ tiêu chí chấm

| Tiêu chí | Bằng chứng nên trình diễn |
|---|---|
| Hiểu người dùng — 25 | Cán bộ thấy việc cần làm ngay; phân đúng loại/đội; vai trò thanh niên xác minh rõ ràng |
| UX/UI — 30 | Một luồng hoàn chỉnh, ít chuyển trang; thao tác rõ; desktop và mobile; chữ lớn; loading/trống/lỗi/GPS bị từ chối |
| Sáng tạo — 20 | Gợi ý trùng có cán bộ xác nhận; bản đồ và danh sách đồng bộ; AI gợi ý có nhãn minh họa nếu chưa gọi model thật |
| Khả thi/tác động — 25 | Tái sử dụng stack; demo ổn định; tách rõ phần mô phỏng và kiến trúc thực hiện trong 24 giờ |

Đây là cách tạo bằng chứng cho tiêu chí, không phải dự đoán hoặc cam kết điểm.

## 8. Thứ tự triển khai và kiểm chứng

**P0 — bảo đảm dùng được:** sửa nguồn bản đồ; thống nhất seed/số liệu; chặn ID sai; kiểm tra lưu ảnh và trạng thái; thêm đồng bộ tab. Phạm vi: `src/components/Map/OpenStreetMap.tsx`, `src/store/useIncidentStore.ts`, `src/data/mockIncidents.ts`, `src/types/incident.ts` nếu cần lưu ghi chú/lịch sử.

**P1 — thao tác cán bộ:** chỉnh dashboard thành bàn làm việc; liên kết selection/filter; phân công theo loại, hạn thật, lưu ghi chú; cập nhật kết quả có ảnh; menu ngắn. Phạm vi: `src/pages/Dashboard/IocDashboardPage.tsx`, `src/pages/Officer/OfficerInboxPage.tsx`, `src/pages/Officer/DispatchDetailPage.tsx`, `src/modules/map/NearbyIncidentsMapPage.tsx`, `src/modules/field/*`, `src/layouts/DashboardLayout.tsx`, `src/components/Sidebar/*`, CSS.

**P2 — hoàn thiện bài thi:** gộp trùng có xác nhận, các trạng thái lỗi/trống/mobile/chữ lớn; chỉnh wizard về đúng 3 bước; kiểm tra theo dõi của tôi và đánh giá; xuất PDF/thuyết minh khi được yêu cầu. Kiểm tra mọi caller của store/map, kể cả component cũ trong `src/modules/officer/`, trước khi đổi interface.

Kịch bản nghiệm thu:

1. Khởi đầu seed đúng 64/47 và cơ cấu 4 loại; mọi số đếm khớp cùng phạm vi.
2. Tab người dân gửi → tab cán bộ xuất hiện hồ sơ và ghim không reload, mục tiêu demo trong 1 giây trên máy thử.
3. Cán bộ mở từ danh sách hoặc marker → đúng cùng hồ sơ; chọn loại/đơn vị/hạn → lưu đầy đủ; không thông báo gửi SMS thật.
4. Tab hiện trường thấy nhiệm vụ, xác minh/bắt đầu; thiếu ảnh sau không được hoàn tất; thêm ảnh và ghi chú → công khai đúng.
5. Tab người dân thấy ảnh trước/sau, gửi đánh giá → thống kê và chi tiết cập nhật; không ghi đánh giá vào hồ sơ chưa hoàn thành.
6. Mất nền bản đồ, từ chối GPS, lọc rỗng, sai ID, JSON storage hỏng và hết dung lượng → có phản hồi đúng, không thao tác nhầm hoặc báo lưu thành công giả.
7. Chọn hồ sơ rồi lọc ẩn/cập nhật từ tab khác → selection hợp lệ, không panel cũ; thay đổi mới không cướp focus đang nhập.
8. Kiểm tra keyboard, chữ lớn, desktop và mobile; chạy build/lint và self-check logic cho seed, số liệu, hạn và chuyển trạng thái khi triển khai.

Chưa chạy ứng dụng trực tiếp hoặc test trong đợt nghiên cứu này; đánh giá hiện trạng dựa trên ảnh người dùng, source, PDF đã trích xuất và xem trang tiêu chí/Đề 2, cùng tài liệu chính thức nêu trên.

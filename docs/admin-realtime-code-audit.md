# Khảo sát mã nguồn admin và cập nhật thời gian thực

Ngày khảo sát: 24/11/2026. Phạm vi: đọc mã nguồn, cấu hình và README; không sửa ứng dụng, không chạy migration, không thao tác dữ liệu người dùng. Không thấy AGENTS.md trong repo và các thư mục cha đã kiểm tra. Repo chưa có quy ước thư mục tài liệu nghiên cứu, nên lưu tại `docs/`.

## Kết luận

Ứng dụng hiện là bản mô phỏng frontend: React đọc một Zustand store, lưu danh sách phản ánh trong localStorage. Việc cập nhật ngay trong cùng phiên trình duyệt có thật, nhưng chưa có nguồn dữ liệu dùng chung hoặc kênh cập nhật giữa cán bộ/người dân trên thiết bị khác. Cần phân biệt **bản đồ nền thật** với **dữ liệu phản ánh mẫu** và **KPI viết sẵn**. Ảnh kiểm tra trình duyệt của phiên làm việc chính cho thấy watermark “API KEY REQUIRED”; tài liệu CARTO xác nhận cần thêm key để bỏ watermark. Ưu tiên hiện tại người dùng đã chọn: demo realtime phục vụ thi, chưa triển khai backend thật.

## 1. Dữ liệu thật, dữ liệu mẫu và số liệu viết sẵn

| Thành phần | Hiện trạng và tác động | Nguồn |
|---|---|---|
| Danh sách phản ánh | Khởi tạo từ localStorage; không có dữ liệu hợp lệ thì sinh mẫu. Chỉ kiểm tra là mảng không rỗng, không kiểm tra cấu trúc từng hồ sơ; mảng rỗng cũng bị thay bằng mẫu. | [useIncidentStore.ts:52](../src/store/useIncidentStore.ts#L52) |
| Bộ mẫu | 64 hồ sơ, 47 hồ sơ xử lý; vị trí, địa chỉ, tên, điện thoại, thời gian, ảnh và trạng thái đều được dựng từ công thức/ảnh mẫu. Không phải báo cáo đã được cơ quan xác thực. | [mockIncidents.ts:45](../src/data/mockIncidents.ts#L45), [mockIncidents.ts:75](../src/data/mockIncidents.ts#L75), [mockIncidents.ts:98](../src/data/mockIncidents.ts#L98), [mockIncidents.ts:121](../src/data/mockIncidents.ts#L121) |
| Phản ánh người dùng thêm | Thao tác thêm/gộp có chạy, thay đổi store và localStorage; ID dùng `Date.now()`, mã dùng độ dài danh sách, năm cố định 2026. Chưa có máy chủ cấp mã/kiểm soát cạnh tranh. | [useIncidentStore.ts:105](../src/store/useIncidentStore.ts#L105), [useIncidentStore.ts:136](../src/store/useIncidentStore.ts#L136) |
| Ảnh người dùng | FileReader đọc ảnh thành data URL; dữ liệu sau đó đi vào localStorage cùng hồ sơ. Không phải upload lên kho ảnh dùng chung. | [SubmitIncidentWizard.tsx:109](../src/modules/citizen/SubmitIncidentWizard.tsx#L109), [useIncidentStore.ts:152](../src/store/useIncidentStore.ts#L152), [useIncidentStore.ts:160](../src/store/useIncidentStore.ts#L160) |
| KPI IOC | Chỉ `total`, `resolved`, `pending` được tính từ store; các số chính 12.450, 94,2%, 14,5 giờ, 96,8%, 4.8/5, 11.230 lượt là hằng trong JSX. Tỷ lệ hoàn tất chưa phải tỷ lệ đúng hạn. | [IocDashboardPage.tsx:31](../src/pages/Dashboard/IocDashboardPage.tsx#L31), [IocDashboardPage.tsx:48](../src/pages/Dashboard/IocDashboardPage.tsx#L48), [IocDashboardPage.tsx:65](../src/pages/Dashboard/IocDashboardPage.tsx#L65), [IocDashboardPage.tsx:83](../src/pages/Dashboard/IocDashboardPage.tsx#L83), [IocDashboardPage.tsx:101](../src/pages/Dashboard/IocDashboardPage.tsx#L101) |
| Lọc bản đồ và biểu đồ IOC | Marker lọc theo dữ liệu store, nhưng nhãn 760/68/240/182 và cơ cấu, thời gian theo ngành viết sẵn. Bảng xếp hạng các địa phương cũng viết sẵn, không có tập dữ liệu nhiều địa phương tương ứng. | [IocDashboardPage.tsx:24](../src/pages/Dashboard/IocDashboardPage.tsx#L24), [IocDashboardPage.tsx:153](../src/pages/Dashboard/IocDashboardPage.tsx#L153), [IocDashboardPage.tsx:198](../src/pages/Dashboard/IocDashboardPage.tsx#L198), [IocDashboardPage.tsx:243](../src/pages/Dashboard/IocDashboardPage.tsx#L243), [IocDashboardPage.tsx:289](../src/pages/Dashboard/IocDashboardPage.tsx#L289) |
| Sự kiện khẩn IOC | Ba thẻ viết sẵn trỏ `inc-1/2/3`, không chọn theo priority. Bộ mẫu tạo `inc-1` thuộc chiếu sáng và đã resolved, nhưng thẻ đầu gọi là ổ gà khẩn cấp: liên kết có thể đưa người dùng tới hồ sơ khác nội dung thẻ. | [IocDashboardPage.tsx:375](../src/pages/Dashboard/IocDashboardPage.tsx#L375), [mockIncidents.ts:51](../src/data/mockIncidents.ts#L51), [mockIncidents.ts:64](../src/data/mockIncidents.ts#L64) |
| Danh sách tiếp nhận | Nội dung hồ sơ động, nhưng nhãn “10 phút trước/45 phút trước/Hôm qua” dựa vào chỉ số hàng; chân trang ghi 20 hồ sơ và nút trang chưa có handler. | [OfficerInboxPage.tsx:189](../src/pages/Officer/OfficerInboxPage.tsx#L189), [OfficerInboxPage.tsx:277](../src/pages/Officer/OfficerInboxPage.tsx#L277) |

## 2. Bản đồ và nghi vấn API key

- Đường phố dùng URL raster CARTO Voyager; vệ tinh dùng ESRI World Imagery. Cả hai URL hiện không có tham số key/token; code không dùng Google Maps, Mapbox hay biến môi trường cho bản đồ. Đây là kết luận về mã nguồn hiện có, chưa phải xác nhận điều kiện thương mại/quota của nhà cung cấp: [OpenStreetMap.tsx:62](../src/components/Map/OpenStreetMap.tsx#L62), [OpenStreetMap.tsx:102](../src/components/Map/OpenStreetMap.tsx#L102).
- Reverse geocoding là request trực tiếp tới Nominatim, tách biệt với tải tile: [SubmitIncidentWizard.tsx:155](../src/modules/citizen/SubmitIncidentWizard.tsx#L155).
- Phiên kiểm tra trình duyệt chính quan sát watermark “API KEY REQUIRED”. [Hướng dẫn chính thức CARTO](https://carto.com/basemaps/apikey/) xác nhận thêm `?key=YOUR_KEY` vào URL tile để bỏ watermark; source hiện thiếu key ở cả hai nơi tạo street layer (dòng 64 và 122). Đây là lỗi cấu hình hiển thị đã có bằng chứng, không nên đánh đồng với sự cố map trắng. Với demo, dùng key được cấp cho frontend theo phạm vi nhà cung cấp hoặc chuyển sang provider đã kiểm tra điều kiện sử dụng phù hợp; không đưa secret máy chủ vào bundle.
- Không có handler `tileerror`, trạng thái đang tải/lỗi hoặc fallback provider. Cần bổ sung thông báo lỗi tại component chung để phân biệt lỗi mạng/dịch vụ/request bị chặn với watermark do key.
- GPS lỗi sẽ tự đưa về tọa độ trung tâm và gọi callback như người dùng đã chọn vị trí; người dùng có thể hiểu nhầm đó là GPS thật: [OpenStreetMap.tsx:153](../src/components/Map/OpenStreetMap.tsx#L153).
- Popup Leaflet ghép `title`, `address`, URL ảnh và nhãn ghim trực tiếp vào HTML. Khi nối dữ liệu thực từ người dùng, cần dùng DOM/textContent hoặc escape chặt chẽ trước khi đưa vào `bindPopup`; hiện không thấy bước đó: [OpenStreetMap.tsx:209](../src/components/Map/OpenStreetMap.tsx#L209), [OpenStreetMap.tsx:265](../src/components/Map/OpenStreetMap.tsx#L265).

## 3. Trạng thái, phân công và xác minh

Trạng thái khai báo: `pending | assigned | in_progress | resolved | closed`: [incident.ts:3](../src/types/incident.ts#L3).

| Hành động | Logic thực tế | Khoảng trống |
|---|---|---|
| Phân công | Đặt bất kỳ hồ sơ tìm được thành `assigned`, ghi tên đơn vị/cán bộ và deadline. | Không chặn phân công lại hồ sơ đã resolved/closed; không kiểm tra quyền, đơn vị tồn tại, deadline hợp lệ; ghi đè phân công cũ mà không có lịch sử. [useIncidentStore.ts:166](../src/store/useIncidentStore.ts#L166) |
| Xác minh | Gắn `verifiedByVolunteer=true`; nếu pending chuyển thẳng in_progress; nối ghi chú vào description. | Không có bản ghi riêng người/thời điểm/kết quả xác minh; có thể bỏ qua phân công, tạo hồ sơ in_progress không có assignedTo. [useIncidentStore.ts:187](../src/store/useIncidentStore.ts#L187) |
| Hoàn thành | Bất kỳ ID tồn tại đều chuyển resolved; ảnh rỗng được thay bằng ảnh mẫu. | Không kiểm tra trạng thái trước, người xử lý đúng đơn vị, chứng cứ bắt buộc; chưa có bước cán bộ nghiệm thu riêng. [useIncidentStore.ts:203](../src/store/useIncidentStore.ts#L203) |
| Đánh giá | Bất kỳ ID tồn tại đều chuyển closed, ghi sao/tiêu chí/bình luận. | Không kiểm tra đã resolved, chủ hồ sơ, khoảng sao, đánh giá trùng. [useIncidentStore.ts:225](../src/store/useIncidentStore.ts#L225) |

Các vấn đề tại caller đang sử dụng:

- `DispatchDetailPage` lấy hồ sơ không tìm thấy ID bằng **hồ sơ đầu danh sách**. URL sai có thể phân công nhầm; danh sách rỗng có thể gây lỗi truy cập thuộc tính: [DispatchDetailPage.tsx:43](../src/pages/Officer/DispatchDetailPage.tsx#L43).
- Ghi chú điều động và checkbox Zalo/SMS chỉ là state UI; submit không truyền/lưu chúng, nhưng luôn báo đã gửi Zalo/SMS. Khoảng cách đội và đếm ngược SLA 22 giờ 15 phút cũng viết sẵn: [DispatchDetailPage.tsx:14](../src/pages/Officer/DispatchDetailPage.tsx#L14), [DispatchDetailPage.tsx:45](../src/pages/Officer/DispatchDetailPage.tsx#L45), [DispatchDetailPage.tsx:52](../src/pages/Officer/DispatchDetailPage.tsx#L52), [DispatchDetailPage.tsx:87](../src/pages/Officer/DispatchDetailPage.tsx#L87).
- Trang hiện trường lọc toàn bộ hồ sơ assigned/in_progress, không theo người/đơn vị đăng nhập; danh sách cần xác minh gồm cả hồ sơ resolved/closed chưa có flag: [FieldTasksPage.tsx:13](../src/modules/field/FieldTasksPage.tsx#L13).
- Có flow phân công cũ `OfficerDashboardPage → DispatchModal`, nhưng `App` hiện route đến `OfficerInboxPage → DispatchDetailPage`, không import màn hình cũ. Cần tránh chỉ sửa modal cũ rồi tưởng đã sửa luồng đang chạy: [App.tsx:7](../src/App.tsx#L7), [App.tsx:53](../src/App.tsx#L53), [DispatchModal.tsx:30](../src/modules/officer/DispatchModal.tsx#L30).

## 4. Persistence và realtime

- Store được tạo một lần từ localStorage; các mutation ghi lại cả mảng rồi `set` Zustand. React theo dõi store sẽ cập nhật ngay trong cùng ứng dụng: [useIncidentStore.ts:71](../src/store/useIncidentStore.ts#L71), [useIncidentStore.ts:160](../src/store/useIncidentStore.ts#L160).
- Qua tìm kiếm toàn bộ `src`, chỉ thấy `fetch` geocoding; không thấy REST API sự cố, WebSocket, SSE/EventSource, subscription, polling hoặc listener `storage`. Vì vậy ngay cả hai tab mở sẵn cũng không tự nạp thay đổi của nhau; hai tab ghi đồng thời có nguy cơ ghi đè snapshot cũ. Đây là suy luận từ cơ chế tải một lần và ghi cả mảng, chưa chạy kiểm thử cạnh tranh.
- Lỗi đọc localStorage có cảnh báo/fallback, nhưng các mutation ghi không có catch; ảnh data URL làm payload tăng, lỗi dung lượng/quyền lưu có thể khiến action thất bại trước khi cập nhật store: [useIncidentStore.ts:52](../src/store/useIncidentStore.ts#L52), [useIncidentStore.ts:161](../src/store/useIncidentStore.ts#L161), [SubmitIncidentWizard.tsx:119](../src/modules/citizen/SubmitIncidentWizard.tsx#L119).
- Reset thay toàn bộ hồ sơ bằng mẫu; không phải nạp lại dữ liệu máy chủ: [useIncidentStore.ts:259](../src/store/useIncidentStore.ts#L259).

## 5. Auth và phân quyền

- `useAuthStore` mặc định là tài khoản cán bộ; `loginAs` chỉ chọn một profile dựng sẵn, logout chuyển sang profile công dân: [useAuthStore.ts:13](../src/store/useAuthStore.ts#L13), [useAuthStore.ts:58](../src/store/useAuthStore.ts#L58).
- Form login không kiểm tra username/password, luôn loginAs officer. Quick login cho phép chọn mọi vai trò: [LoginPage.tsx:13](../src/pages/Auth/LoginPage.tsx#L13).
- Route admin/dispatch/verify chỉ lồng trong layout, không guard kiểm tra phiên hay role. Store nghiệp vụ cũng không đọc auth trước khi mutation: [App.tsx:45](../src/App.tsx#L45), [useIncidentStore.ts:166](../src/store/useIncidentStore.ts#L166).
- Hai kiểu role chưa thống nhất: auth có leader, còn `UserRole` của incident không có leader; `currentRole` riêng mặc định citizen và không được ràng buộc với currentUser: [useAuthStore.ts:7](../src/store/useAuthStore.ts#L7), [incident.ts:7](../src/types/incident.ts#L7), [useIncidentStore.ts:73](../src/store/useIncidentStore.ts#L73).

## 6. Đề xuất nhỏ nhất nhưng hoàn chỉnh

### A. Làm bản demo trung thực và nhất quán trước

1. KPI, nhãn lọc, sự kiện khẩn và thời gian tương đối đều lấy từ cùng danh sách; bỏ/ghi rõ mẫu đối với dữ liệu chưa có (xếp hạng 30 địa phương, tăng trưởng kỳ trước, khoảng cách đội, trạng thái gửi SMS). Tính tỷ lệ đúng hạn từ `resolution.resolvedAt <= assignedTo.deadline`, không gọi tỷ lệ hoàn tất là đúng hạn; dữ liệu thiếu trả “chưa đủ dữ liệu”.
2. Không tìm thấy ID thì hiển thị hồ sơ không tồn tại, tuyệt đối không fallback hồ sơ khác. Chốt một quy trình: xác minh là metadata độc lập, phân công pending→assigned, nhận việc assigned→in_progress, hoàn thành in_progress→resolved, chủ hồ sơ đánh giá resolved→closed; quyết định rõ có cần nghiệm thu cán bộ riêng trước closed hay không. Kiểm tra tập trung trong mutation dùng chung.
3. Ghi đúng trạng thái demo; ngừng thông báo gửi Zalo/SMS thành công khi chưa có API. Lưu ghi chú phân công nếu UI vẫn cho nhập. Phân biệt tọa độ fallback với GPS thành công; hiển thị lỗi tile và retry.
4. Kiểm tra schema dữ liệu lưu, chấp nhận danh sách rỗng, xử lý lỗi ghi; không reset dữ liệu thật bằng mẫu. Với phạm vi demo thi đã chọn, dùng listener `storage` để nạp thay đổi giữa hai tab cùng origin; tab phát lệnh cập nhật qua Zustand hiện có. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) xác nhận sự kiện gửi tới các document khác cùng storage, không gửi lại document vừa ghi. Phải ghi rõ giới hạn: chưa giải quyết nhiều thiết bị hoặc ghi đồng thời. Không cần thêm backend, WebSocket hay SDK cho phạm vi này.

### B. Nếu yêu cầu là nhiều cán bộ/người dân dùng thời gian thực

Cần thêm một nguồn dữ liệu máy chủ có DB, xác thực và phân quyền; đây không thể hoàn thành chỉ bằng sửa giao diện. Tối thiểu gồm người dùng/đơn vị, incident, assignment, verification và lịch sử trạng thái; ảnh ở object storage; server cấp ID/mã, thời gian, kiểm tra chuyển trạng thái và version để từ chối ghi đè dữ liệu mới. Client nạp snapshot rồi nhận sự kiện thay đổi; khi reconnect lấy lại snapshot để bù mất sự kiện. Duy trì một bộ nhớ Zustand hiện có, không tạo store dữ liệu thứ hai. Route guard chỉ hỗ trợ UX; máy chủ phải kiểm tra quyền từng thao tác và chỉ trả thông tin cá nhân theo phạm vi cần thiết.

Chưa chọn vendor/backend vì repo chưa có stack máy chủ hay thông tin hạ tầng. Chọn trước một dịch vụ có DB/Auth/Storage/kênh realtime hoặc backend hiện hữu của đơn vị; không thêm nhiều hệ thống thông báo/queue nếu chưa có nhu cầu. Zalo/SMS nên là giai đoạn riêng sau khi đã có nhà cung cấp và trạng thái giao nhận thực.

### Các file dự kiến chịu ảnh hưởng khi triển khai

| Phạm vi | File |
|---|---|
| Model, chuyển trạng thái, quyền chủ hồ sơ, version/audit | `src/types/incident.ts`, `src/store/useIncidentStore.ts` |
| Auth/role/route | `src/store/useAuthStore.ts`, `src/pages/Auth/LoginPage.tsx`, `src/App.tsx`, `src/layouts/DashboardLayout.tsx` |
| KPI/lọc/khẩn/thời gian | `src/pages/Dashboard/IocDashboardPage.tsx`, `src/pages/Officer/OfficerInboxPage.tsx` |
| Phân công/xác minh/hoàn thành | `src/pages/Officer/DispatchDetailPage.tsx`, `src/modules/field/FieldTasksPage.tsx`, `src/modules/field/IncidentResolutionModal.tsx` |
| Bản đồ/upload/chủ hồ sơ/đánh giá | `src/components/Map/OpenStreetMap.tsx`, `src/modules/citizen/SubmitIncidentWizard.tsx`, `src/modules/citizen/MyReportsPage.tsx`, `src/modules/citizen/CitizenRatingModal.tsx`, `src/modules/map/NearbyIncidentsMapPage.tsx` |
| Dữ liệu demo và mô tả | `src/data/mockIncidents.ts`, `README.md` |
| Chỉ khi chọn backend thật | Thêm module client kết nối, cấu hình môi trường mẫu, schema/migration/policy và kiểm thử tích hợp tương ứng; cập nhật `package.json` nếu SDK đã chọn cần dependency. |
| Mã cũ chưa route | Chỉ sửa `src/modules/officer/OfficerDashboardPage.tsx` / `DispatchModal.tsx` nếu tiếp tục duy trì; hoặc xóa sau khi xác nhận không còn caller. |

### Tiêu chí nghiệm thu đề nghị

- Gửi phản ánh ở tài khoản công dân A, admin B trên thiết bị khác thấy đúng hồ sơ và KPI cập nhật; refresh giữ được dữ liệu.
- Một hồ sơ không thể bị phân công nhầm khi URL sai; trạng thái kết thúc không bị ghi ngược; hai người ghi cùng version được xử lý xung đột rõ ràng.
- Xác minh ghi đúng người/thời điểm, không tạo trạng thái đang xử lý thiếu đơn vị; tác vụ hiện trường chỉ hiện đúng phạm vi được giao.
- Role không được phép bị máy chủ từ chối, kể cả gọi API ngoài giao diện; công dân chỉ sửa/đánh giá hồ sơ được phép.
- Tile lỗi, GPS từ chối, upload lỗi, ghi dữ liệu lỗi và mất/kết nối lại realtime đều có thông báo đúng; UI không báo gửi tin thành công giả.

## Giới hạn kiểm chứng

Nhánh nghiên cứu này không trực tiếp chạy app/trình duyệt; phát hiện watermark và đối chiếu tài liệu CARTO/MDN được phiên làm việc chính cung cấp. Chưa kiểm tra network tile, xác nhận điều khoản/quota provider, đo tải hay thử nhiều thiết bị; chưa kiểm thử hoặc pentest. Báo cáo chỉ chứng minh cấu trúc và logic thấy trong mã nguồn. Chưa thay đổi ứng dụng hoặc chọn nhà cung cấp backend.

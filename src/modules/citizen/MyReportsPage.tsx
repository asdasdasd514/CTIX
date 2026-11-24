import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useIncidentStore } from "../../store/useIncidentStore";
import { Incident } from "../../types/incident";
import { deadlineLabel } from "../../lib/incidents";
import { PRESET_ACCOUNTS } from "../../store/useAuthStore";
import { CitizenRatingModal } from "./CitizenRatingModal";
import {
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  PlusCircle,
  Search,
  ArrowRight,
} from "lucide-react";

export const MyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "resolved"
  >("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(params.get("id"));
  const [mineOnly, setMineOnly] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<Incident | null>(null);

  const filteredList = incidents.filter((item) => {
    if (
      mineOnly &&
      item.sender.phone.replace(/[\s.]/g, "") !==
        PRESET_ACCOUNTS.citizen.phone.replace(/[\s.]/g, "") &&
      !item.linkedReports?.some(
        (r) =>
          r.sender.phone ===
          PRESET_ACCOUNTS.citizen.phone.replace(/[\s.]/g, ""),
      )
    )
      return false;
    if (statusFilter === "pending") {
      if (item.status === "resolved" || item.status === "closed") return false;
    }
    if (statusFilter === "resolved") {
      if (item.status !== "resolved" && item.status !== "closed") return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAddress = item.location.address.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchAddress) return false;
    }
    return true;
  });

  const selectedIncident =
    filteredList.find((i) => i.id === selectedId) ||
    (!selectedId ? filteredList[0] : null);
  const getStatusBadge = (status: Incident["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ tiếp nhận
          </span>
        );
      case "assigned":
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
            Đã giao đơn vị
          </span>
        );
      case "in_progress":
        return (
          <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Đang khắc phục tại chỗ
          </span>
        );
      case "resolved":
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã hoàn thành
          </span>
        );
      case "closed":
        return (
          <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-300">
            Đã đánh giá
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER VỚI NÚT "+ THÊM PHẢN ÁNH MỚI" NỔI BẬT */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-block bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Cổng Dân Sinh • Phường Trấn Biên
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Theo dõi phản ánh
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Xem tiến độ xử lý công khai minh bạch • Nhấn nút bên cạnh để gửi
              thêm phản ánh mới
            </p>
          </div>

          {/* NÚT THÊM PHẢN ÁNH (CHUYỂN SANG FORM ĐIỀN THÔNG TIN 2 BƯỚC) */}
          <button
            onClick={() => navigate("/citizen/submit")}
            className="flex items-center gap-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-6 py-3.5 rounded-xl shadow-lg transition shrink-0 active:scale-95 text-xs sm:text-sm"
          >
            <PlusCircle className="w-5 h-5 text-slate-900" />
            <span>+ THÊM PHẢN ÁNH MỚI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <label className="urgent-filter">
        <input
          type="checkbox"
          checked={mineOnly}
          onChange={(e) => {
            setMineOnly(e.target.checked);
            setSelectedId(null);
          }}
        />
        Chỉ phản ánh của tôi (tài khoản demo)
      </label>
      {/* 2. THANH CÔNG CỤ: TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Bộ lọc trạng thái */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({incidents.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === "pending"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đang xử lý
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === "resolved"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đã hoàn thành
          </button>
        </div>

        {/* Ô Tìm Kiếm Nhanh */}
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã PA-001, tên đường, loại sự cố..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. BỐ CỤC CHÍNH 2 CỘT CHUẨN MÀN HÌNH MÁY TÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 / 12 CỘT): DANH SÁCH THẺ HỒ SƠ */}
        <div className="lg:col-span-7 space-y-3">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Không tìm thấy phản ánh nào phù hợp với bộ lọc
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedIncident?.id === item.id;
              const isResolved =
                item.status === "resolved" || item.status === "closed";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
                  className={`bg-white rounded-2xl border-2 p-4 sm:p-5 transition cursor-pointer shadow-2xs ${
                    isSelected
                      ? "border-blue-600 ring-4 ring-blue-500/10 bg-blue-50/20"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.code}
                      </span>
                      {getStatusBadge(item.status)}
                      {item.sameReportsCount > 1 && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                          🔥 {item.sameReportsCount} người cùng báo
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mt-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                      <img
                        src={item.photosBefore[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      <div className="text-xs text-slate-600 flex items-center gap-1 mt-2 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {item.location.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Thẻ */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {isResolved
                          ? "Đã nghiệm thu xong"
                          : deadlineLabel(item)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-blue-700 font-bold text-xs">
                      <span>
                        {isSelected
                          ? "Đang xem chi tiết"
                          : "Bấm để xem chi tiết"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI (5 / 12 CỘT): PANEL CHI TIẾT & ĐÁNH GIÁ 5 SAO (STICKY) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          {selectedIncident ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
              {/* Header Hồ Sơ */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedIncident.code}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {selectedIncident.title}
                  </h2>
                </div>
                {getStatusBadge(selectedIncident.status)}
              </div>

              {/* So sánh ảnh Trước - Sau (Before & After) */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
                  Hình ảnh xác minh hiện trường:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-rose-700 block">
                      ● Ảnh lúc người dân báo:
                    </span>
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                      <img
                        src={selectedIncident.photosBefore[0]}
                        alt="Trước"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      ● Ảnh sau khi hoàn tất:
                    </span>
                    <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center">
                      {selectedIncident.photosAfter &&
                      selectedIncident.photosAfter[0] ? (
                        <img
                          src={selectedIncident.photosAfter[0]}
                          alt="Sau"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 text-xs">
                          <Clock className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span>Đang thi công</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Tiến Trình 4 Bước */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-800 uppercase block">
                  Tiến trình giải quyết của UBND Phường:
                </span>

                <div className="space-y-3 text-xs">
                  {/* Bước 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        1. Đã tiếp nhận phản ánh
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(selectedIncident.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bước 2 */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.assignedTo
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {selectedIncident.assignedTo ? "✓" : "2"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        2. Cán bộ phân công xử lý
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedIncident.assignedTo
                          ? `Giao cho: ${selectedIncident.assignedTo.unitName}`
                          : "Đang xếp lịch kiểm tra"}
                      </div>
                    </div>
                  </div>

                  {/* Bước 3 */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.status === "resolved" ||
                        selectedIncident.status === "closed"
                          ? "bg-emerald-600 text-white"
                          : selectedIncident.status === "in_progress"
                            ? "bg-blue-600 text-white animate-pulse"
                            : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {selectedIncident.status === "resolved" ||
                      selectedIncident.status === "closed"
                        ? "✓"
                        : "3"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        3. Đội kỹ thuật khắc phục hiện trường
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedIncident.status === "resolved" ||
                        selectedIncident.status === "closed"
                          ? "Đã thi công xong và nộp ảnh nghiệm thu"
                          : "Đang triển khai theo thời hạn SLA"}
                      </div>
                    </div>
                  </div>

                  {/* Bước 4 */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.rating
                          ? "bg-emerald-600 text-white"
                          : selectedIncident.status === "resolved"
                            ? "bg-amber-500 text-white "
                            : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {selectedIncident.rating ? "✓" : "4"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        4. Đánh giá hài lòng của người dân
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {selectedIncident.rating
                          ? `Đã đánh giá: ${selectedIncident.rating.stars} sao ★`
                          : "Chờ người dân chấm điểm chất lượng"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút đánh giá 5 sao */}
              {(selectedIncident.status === "resolved" ||
                selectedIncident.status === "closed") &&
                (selectedIncident.sender.phone.replace(/[\s.]/g, "") ===
                  PRESET_ACCOUNTS.citizen.phone.replace(/[\s.]/g, "") ||
                  selectedIncident.linkedReports?.some(
                    (r) =>
                      r.sender.phone ===
                      PRESET_ACCOUNTS.citizen.phone.replace(/[\s.]/g, ""),
                  )) && (
                  <div className="pt-2">
                    {selectedIncident.rating ? (
                      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-center space-y-1">
                        <div className="flex items-center justify-center gap-1 text-amber-500 text-lg">
                          {Array.from({
                            length: selectedIncident.rating.stars,
                          }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        <div className="font-bold text-xs text-amber-900">
                          Bạn đã đánh giá {selectedIncident.rating.stars}/5 sao
                        </div>
                        {selectedIncident.rating.comment && (
                          <p className="text-xs text-amber-800 italic">
                            "{selectedIncident.rating.comment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setRatingTarget(selectedIncident)}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 rounded-xl font-black shadow-md transition flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm"
                      >
                        <Star className="w-4 h-4 fill-slate-900" />
                        <span>ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG (5 SAO)</span>
                      </button>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Chọn một phản ánh bên trái để xem tiến độ chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal Chấm Điểm Hài Lòng */}
      {ratingTarget && (
        <CitizenRatingModal
          incident={ratingTarget}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
};

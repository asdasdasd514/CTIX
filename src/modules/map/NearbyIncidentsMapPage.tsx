import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIncidentStore } from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  MapPin,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  ThumbsUp,
  ArrowRight,
  Camera,
  Layers,
} from "lucide-react";

export const NearbyIncidentsMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, categoryFilter, setCategoryFilter, upvoteIncident } =
    useIncidentStore();
  const { currentUser } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "resolved"
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Lọc dữ liệu hiển thị trên bản đồ
  const filteredList = incidents.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter)
      return false;
    if (
      statusFilter === "pending" &&
      (item.status === "resolved" || item.status === "closed")
    )
      return false;
    if (
      statusFilter === "resolved" &&
      item.status !== "resolved" &&
      item.status !== "closed"
    )
      return false;
    return true;
  });

  const selectedIncident =
    filteredList.find((i) => i.id === selectedId) || null;

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER ĐỒNG NHẤT */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-block bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Bản Đồ Không Gian Đô Thị
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Giám Sát Phản Ánh Hiện Trường Phường Trấn Biên
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Trực quan hóa vị trí các phản ánh trên OpenStreetMap thời gian
              thực • Bấm để xem chi tiết hoặc đồng thuận (+1 Upvote)
            </p>
          </div>

          <button
            onClick={() => navigate("/citizen/submit")}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-5 py-3 rounded-xl shadow-md transition shrink-0 active:scale-95 text-xs sm:text-sm"
          >
            <Camera className="w-4 h-4 text-slate-900" />
            <span>GỬI PHẢN ÁNH MỚI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. THANH LỌC DANH MỤC & TRẠNG THÁI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Lọc sự cố:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                categoryFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả ({incidents.length})
            </button>
            <button
              onClick={() => setCategoryFilter("street_light")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                categoryFilter === "street_light"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" /> 💡 Đèn chiếu sáng
            </button>
            <button
              onClick={() => setCategoryFilter("flooding")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                categoryFilter === "flooding"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Waves className="w-3.5 h-3.5" /> 🌊 Ngập úng
            </button>
            <button
              onClick={() => setCategoryFilter("waste")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                categoryFilter === "waste"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> 🗑️ Rác thải
            </button>
            <button
              onClick={() => setCategoryFilter("road_damage")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                categoryFilter === "road_damage"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Construction className="w-3.5 h-3.5" /> 🚧 Ổ gà mặt đường
            </button>
          </div>
        </div>

        {/* Lọc trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chưa xử lý / Đang xử lý</option>
          <option value="resolved">Đã khắc phục xong</option>
        </select>
      </div>

      {/* 3. BỐ CỤC CHÍNH 2 CỘT CHUẨN MÀN HÌNH MÁY TÍNH (8 CỘT BẢN ĐỒ + 4 CỘT CHI TIẾT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* VÙNG BẢN ĐỒ THỰC TẾ OPENSTREETMAP (8 / 12 CỘT) */}
        <div className="lg:col-span-8 bg-white rounded-2xl overflow-hidden shadow-2xs relative border border-slate-200/90 flex flex-col">
          <OpenStreetMap
            height="580px"
            incidents={filteredList}
            selectedId={selectedIncident?.id}
            onMarkerClick={(item) => setSelectedId(item.id)}
          />

          <div className="work-map-legend">
            <span>
              <i className="legend-dot amber" />
              Chờ phân công
            </span>
            <span>
              <i className="legend-dot blue" />
              Đang xử lý
            </span>
            <span>
              <i className="legend-dot rose" />
              Khẩn / quá hạn
            </span>
            <span>
              <i className="legend-dot green" />
              Đã xử lý
            </span>
            <span>Đ: đèn · N: ngập · R: rác · M: mặt đường</span>
          </div>
        </div>

        {/* PANEL CHI TIẾT SỰ CỐ ĐANG CHỌN (4 / 12 CỘT - STICKY) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
            {selectedIncident ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedIncident.code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedIncident.status === "resolved" ||
                      selectedIncident.status === "closed"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedIncident.status === "resolved" ||
                    selectedIncident.status === "closed"
                      ? "✓ Đã hoàn thành"
                      : "Đang giải quyết"}
                  </span>
                </div>

                {/* Ảnh hiện trường */}
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs">
                  <img
                    src={selectedIncident.photosBefore[0]}
                    alt="Hiện trường"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {selectedIncident.description}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{selectedIncident.location.address}</span>
                  </div>
                  {selectedIncident.assignedTo && (
                    <div className="text-[11px] text-blue-800 pt-1.5 border-t border-slate-200 font-bold">
                      🏢 Đơn vị xử lý: {selectedIncident.assignedTo.unitName}
                    </div>
                  )}
                </div>

                {/* Nút đồng phản ánh */}
                <button
                  onClick={() => {
                    try {
                      upvoteIncident(selectedIncident.id);
                    } catch (error) {
                      alert((error as Error).message);
                    }
                  }}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                  <span>
                    Tôi cũng thấy sự cố này (+
                    {selectedIncident.sameReportsCount} người)
                  </span>
                </button>

                {/* Nút phân công nhanh nếu là cán bộ */}
                {currentUser.role !== "citizen" &&
                  selectedIncident.status === "pending" && (
                    <button
                      onClick={() =>
                        navigate(`/dispatch/${selectedIncident.id}`)
                      }
                      className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Chuyển sang phân công xử lý</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Chạm vào bất kỳ điểm ghim nào trên bản đồ OpenStreetMap để xem
                chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

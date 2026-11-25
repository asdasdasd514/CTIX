import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident, IncidentCategory } from '../../types/incident';
import { isPublicIncident } from '../../lib/incidents';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  Camera,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  Phone,
  ArrowRight,
  ThumbsUp,
  Map as MapIcon,
} from 'lucide-react';

export const CitizenHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, elderlyMode, upvoteIncident, refreshIncidents } = useIncidentStore();

  useEffect(() => {
    void refreshIncidents();
  }, [refreshIncidents]);

  // Đồng nhất 100% với Danh sách phản ánh: chỉ hiển thị hồ sơ công khai đã được duyệt
  const publicIncidents = incidents.filter(isPublicIncident);

  // Chỉ hiển thị trên bản đồ các sự cố ĐÃ DUYỆT và CHƯA xử lý xong
  const activeIncidents = publicIncidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed'
  );

  const [mapCategory, setMapCategory] = useState<'all' | IncidentCategory>('all');
  const [selectedMapIncident, setSelectedMapIncident] = useState<Incident | null>(
    activeIncidents[0] || null
  );

  const pendingCount = activeIncidents.length;
  const resolvedList = publicIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed');
  const resolvedCount = resolvedList.length;
  const resolvedRate = publicIncidents.length > 0 ? Math.round((resolvedCount / publicIncidents.length) * 100) : 0;

  // Tính thời gian xử lý trung bình (ngày) từ dữ liệu thực tế (chuẩn mẫu 3,2 ngày)
  const resolvedWithTime = resolvedList.filter((i) => i.resolution?.resolvedAt);
  const avgDaysNumber =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, item) => {
          const diffMs =
            new Date(item.resolution!.resolvedAt).getTime() - new Date(item.createdAt).getTime();
          return sum + Math.max(0.1, diffMs / (1000 * 60 * 60 * 24));
        }, 0) / resolvedWithTime.length
      : 3.2;
  const avgDaysFormatted = avgDaysNumber.toFixed(1).replace('.', ',');

  // Tính mức độ hài lòng thật từ đánh giá của công dân (đồng bộ 100% với Dashboard Admin)
  const ratedList = publicIncidents.filter((i) => i.rating?.stars);
  const avgStars =
    ratedList.length > 0
      ? (ratedList.reduce((s, i) => s + (i.rating?.stars || 0), 0) / ratedList.length).toFixed(1)
      : '5.0';
  const satisfactionPct =
    ratedList.length > 0
      ? ((ratedList.filter((i) => (i.rating?.stars || 0) >= 4).length / ratedList.length) * 100)
          .toFixed(1)
          .replace('.', ',')
          .replace(',0', '')
      : '100';

  // Tự động lấy sự cố Khẩn cấp mới nhất đang mở từ MongoDB cho thanh cảnh báo
  const latestUrgent =
    activeIncidents.find((i) => i.priority === 'urgent') || null;

  const streetLightCount = publicIncidents.filter((i) => i.category === 'street_light').length;
  const floodingCount = publicIncidents.filter((i) => i.category === 'flooding').length;
  const wasteCount = publicIncidents.filter((i) => i.category === 'waste').length;
  const roadDamageCount = publicIncidents.filter((i) => i.category === 'road_damage').length;

  const myRecentReports = publicIncidents.slice(0, 3);

  const filteredMapIncidents = activeIncidents.filter((item) => {
    if (mapCategory !== 'all' && item.category !== mapCategory) return false;
    return true;
  });

  const getCategoryText = (cat: IncidentCategory) => {
    switch (cat) {
      case 'street_light':
        return 'Đèn đường';
      case 'flooding':
        return 'Ngập úng';
      case 'waste':
        return 'Rác thải';
      case 'road_damage':
        return 'Ổ gà';
      case 'other':
        return 'Sự cố khác';
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* CHẾ ĐỘ TỐI GIẢN & TƯƠNG PHẢN CAO KHI BẬT "NGƯỜI CAO TUỔI" */}
      {elderlyMode ? (
        <section className="bg-white border-2 border-slate-900 rounded-[5px] p-5 sm:p-7 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
            <div>
              <span className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-[5px] border-2 border-slate-900 uppercase">
                Chế độ Người cao tuổi • Dễ nhìn & Dễ bấm
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2">
                Phường Trấn Biên hỗ trợ cô bác 24/7
              </h1>
            </div>
          </div>

          <p className="text-base text-slate-900 font-semibold leading-relaxed">
            Thấy đèn đường tắt, đường ngập nước, bãi rác hay ổ gà? Cô bác chỉ cần bấm nút lớn màu vàng bên dưới để chụp ảnh hoặc nói mô tả sự cố.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/citizen/submit')}
              className="w-full py-5 px-6 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-[5px] border-2 border-slate-950 shadow-md flex items-center justify-center gap-3 text-lg uppercase"
            >
              <Camera className="w-7 h-7 shrink-0" />
              <span>Gửi phản ánh mới</span>
              <ArrowRight className="w-6 h-6 shrink-0" />
            </button>

            <button
              onClick={() => navigate('/citizen/reports')}
              className="w-full py-5 px-6 bg-blue-800 hover:bg-blue-900 text-white font-black rounded-[5px] border-2 border-slate-950 shadow-md flex items-center justify-center gap-3 text-lg uppercase"
            >
              <ClipboardList className="w-7 h-7 shrink-0" />
              <span>Xem phản ánh đã gửi</span>
            </button>
          </div>

          <a
            href="tel:1022"
            className="w-full py-4 px-5 bg-rose-50 hover:bg-rose-100 text-rose-900 font-black rounded-[5px] border-2 border-rose-700 flex items-center justify-center gap-2.5 text-base"
          >
            <Phone className="w-6 h-6 text-rose-700 shrink-0" />
            <span>Cần cán bộ hướng dẫn? Bấm gọi tổng đài 1022</span>
          </a>
        </section>
      ) : (
        <>
          {/* 1. HERO BANNER CHÀO MỪNG VỚI ẢNH NỀN VĂN MIẾU TRẤN BIÊN */}
          <section className="relative bg-blue-950 text-white rounded-[5px] p-5 sm:p-8 lg:p-10 shadow-sm overflow-hidden border border-blue-950">
            {/* Ảnh nền Văn Miếu Trấn Biên */}
            <img
              src="/images/tran-bien-banner.jpg"
              alt="Văn Miếu Trấn Biên - Biên Hòa, Đồng Nai"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-65"
            />
            {/* Lớp phủ gradient giúp chữ luôn sắc nét mà vẫn nhìn rõ cảnh Văn Miếu Trấn Biên */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/75 to-blue-900/30" />

            <div className="relative z-10 max-w-2xl space-y-3">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-snug drop-shadow-sm">
                Phản ánh hiện trường Phường Trấn Biên
              </h1>

              <p className="text-xs sm:text-sm text-blue-50 font-medium drop-shadow-sm">
                Chụp ảnh, gửi nhanh — xử lý minh bạch 24/7.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => navigate('/citizen/submit')}
                  className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black rounded-[5px] shadow-md transition active:scale-[0.99] border border-amber-500 uppercase tracking-wide px-5 py-3 text-xs sm:text-sm"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 shrink-0" />
                  <span>Gửi phản ánh</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => navigate('/citizen/reports')}
                  className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold px-5 py-3 rounded-[5px] border border-white/30 transition text-xs sm:text-sm"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span>Theo dõi tiến độ</span>
                </button>
              </div>
            </div>
          </section>

          {/* 2. THỐNG KÊ NHANH (Gọn gàng, tập trung số liệu) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-[5px] p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-blue-700 shadow-sm">
              <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Xử lý trung bình</div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 mt-1">{avgDaysFormatted} ngày</div>
            </div>

            <div className="bg-white rounded-[5px] p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-emerald-600 shadow-sm">
              <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Đã hoàn thành</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-1">
                {resolvedCount}/{publicIncidents.length}{' '}
                <span className="text-xs font-bold text-slate-500">({resolvedRate}%)</span>
              </div>
            </div>

            <div className="bg-white rounded-[5px] p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-amber-500 shadow-sm">
              <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Đang xử lý</div>
              <div className="text-lg sm:text-2xl font-black text-amber-600 mt-1">{pendingCount} sự cố</div>
            </div>

            <div className="bg-white rounded-[5px] p-3.5 sm:p-4 border border-slate-200 border-t-2 border-t-indigo-600 shadow-sm">
              <div className="text-slate-500 text-[11px] sm:text-xs font-semibold">Hài lòng</div>
              <div className="text-lg sm:text-2xl font-black text-blue-700 mt-1">
                {satisfactionPct}% <span className="text-xs text-amber-500">★ {avgStars}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. CẢNH BÁO KHẨN TỰ ĐỘNG TỪ DỮ LIỆU THẬT */}
      {latestUrgent && (
        <button
          type="button"
          onClick={() => navigate(`/citizen/reports/${latestUrgent.id}`)}
          className="w-full text-left bg-amber-50 hover:bg-amber-100/80 border border-amber-200 border-l-4 border-l-amber-500 rounded-[5px] px-4 py-2.5 shadow-sm transition flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-950 font-semibold truncate">
              <strong>Cảnh báo khẩn:</strong> {latestUrgent.title} — {latestUrgent.location.address}
            </p>
          </div>
          <span className="text-[11px] font-bold text-amber-900 inline-flex items-center gap-1 shrink-0">
            <span>Xem</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* 4. CÁC DANH MỤC PHẢN ÁNH THƯỜNG GẶP */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Chọn loại sự cố
          </h2>
          <button
            onClick={() => navigate('/citizen/submit')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 transition flex items-center gap-1"
          >
            <span>Gửi ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 bg-white hover:bg-amber-50/70 rounded-[5px] border border-slate-200 hover:border-amber-400 shadow-sm text-left transition flex items-center justify-between gap-2 min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[5px] bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">Đèn đường</div>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[5px] border border-amber-200 shrink-0">
              {streetLightCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 bg-white hover:bg-blue-50/70 rounded-[5px] border border-slate-200 hover:border-blue-400 shadow-sm text-left transition flex items-center justify-between gap-2 min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[5px] bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                <Waves className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">Ngập nước</div>
            </div>
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200 shrink-0">
              {floodingCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 bg-white hover:bg-emerald-50/70 rounded-[5px] border border-slate-200 hover:border-emerald-400 shadow-sm text-left transition flex items-center justify-between gap-2 min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[5px] bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">Rác thải</div>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[5px] border border-emerald-200 shrink-0">
              {wasteCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/citizen/submit')}
            className="p-3.5 bg-white hover:bg-rose-50/70 rounded-[5px] border border-slate-200 hover:border-rose-400 shadow-sm text-left transition flex items-center justify-between gap-2 min-w-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[5px] bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
                <Construction className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">Mặt đường</div>
            </div>
            <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[5px] border border-rose-200 shrink-0">
              {roadDamageCount}
            </span>
          </button>
        </div>
      </section>

      {/* 5. BẢN ĐỒ PHẢN ÁNH HIỆN TRƯỜNG (ĐƯỢC CHUYỂN TRỰC TIẾP XUỐNG DƯỚI MỤC "BẠN CẦN PHẢN ÁNH VẤN ĐỀ GÌ?") */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon className="w-5 h-5 text-blue-700 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Bản đồ sự cố quanh khu vực
            </h2>
          </div>

          {/* Bộ lọc nhanh trên bản đồ */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMapCategory('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-[5px] border transition ${mapCategory === 'all'
                ? 'bg-blue-700 text-white border-blue-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
            >
              Tất cả chưa xử lý ({activeIncidents.length})
            </button>
            <button
              type="button"
              onClick={() => setMapCategory('street_light')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-[5px] border transition ${mapCategory === 'street_light'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                }`}
            >
              Đèn đường
            </button>
            <button
              type="button"
              onClick={() => setMapCategory('flooding')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-[5px] border transition ${mapCategory === 'flooding'
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                }`}
            >
              Ngập úng
            </button>
            <button
              type="button"
              onClick={() => setMapCategory('waste')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-[5px] border transition ${mapCategory === 'waste'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
            >
              Rác thải
            </button>
            <button
              type="button"
              onClick={() => setMapCategory('road_damage')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-[5px] border transition ${mapCategory === 'road_damage'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400'
                }`}
            >
              Ổ gà
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Cột bản đồ (8/12) */}
          <div className="lg:col-span-8 bg-white rounded-[5px] overflow-hidden shadow-sm border border-slate-200 flex flex-col min-w-0">
            <div className="w-full h-[340px] sm:h-[420px]">
              <OpenStreetMap
                height="100%"
                className="h-full"
                mode="citizen"
                incidents={filteredMapIncidents}
                selectedId={selectedMapIncident?.id}
                onMarkerClick={(item) => setSelectedMapIncident(item)}
              />
            </div>

            {/* Thanh chú giải gọn dưới chân bản đồ (đồng bộ icon với bản đồ) */}
            <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="font-extrabold text-slate-500 uppercase text-[10px]">Chú giải:</span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white inline-flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3 h-3" />
                </span>
                Đèn đường
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center shrink-0">
                  <Waves className="w-3 h-3" />
                </span>
                Ngập nước
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center shrink-0">
                  <Trash2 className="w-3 h-3" />
                </span>
                Rác thải
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white inline-flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                </span>
                Ổ gà
              </span>
            </div>
          </div>

          {/* Cột xem nhanh điểm đang chọn trên bản đồ (4/12) */}
          <div className="lg:col-span-4 bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 flex flex-col justify-between gap-3 min-w-0">
            {selectedMapIncident ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                      {getCategoryText(selectedMapIncident.category)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-[5px] border whitespace-nowrap ${selectedMapIncident.status === 'resolved' || selectedMapIncident.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                    >
                      {selectedMapIncident.status === 'resolved' || selectedMapIncident.status === 'closed'
                        ? '✓ Đã hoàn thành'
                        : 'Đang xử lý'}
                    </span>
                  </div>

                  <div className="aspect-video w-full rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={selectedMapIncident.photosBefore[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-2">
                      {selectedMapIncident.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-start gap-1 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{selectedMapIncident.location.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => upvoteIncident(selectedMapIncident.id)}
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-[5px] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Tôi cũng thấy (+{selectedMapIncident.sameReportsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/citizen/reports/${selectedMapIncident.id}`)}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-[5px] text-xs font-bold transition"
                  >
                    Xem chi tiết tiến độ →
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-slate-400 p-6">
                Nhấn vào một điểm ghim trên bản đồ để xem thông tin sự cố
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. PHẢN ÁNH GẦN ĐÂY & ĐƯỜNG DÂY NÓNG */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* Cột trái (2 cols): Phản ánh gần đây */}
        <div className="lg:col-span-2 bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2 min-w-0">
              <ClipboardList className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="truncate">Hồ sơ phản ánh gần đây</span>
            </h3>
            <button
              onClick={() => navigate('/citizen/reports')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 transition whitespace-nowrap shrink-0"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="space-y-2.5">
            {myRecentReports.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/citizen/reports/${item.id}`)}
                className="p-3 rounded-[5px] border border-slate-200 hover:border-blue-600 bg-slate-50/60 hover:bg-blue-50/30 transition cursor-pointer flex items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-[5px] overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img src={item.photosBefore[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-[5px] border border-blue-200">
                        {getCategoryText(item.category)}
                      </span>
                      <span
                        className={`sm:hidden text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] border ${item.status === 'resolved' || item.status === 'closed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                      >
                        {item.status === 'resolved' || item.status === 'closed' ? 'Đã xong' : 'Đang xử lý'}
                      </span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 min-w-0">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block shrink-0 text-right">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-[5px] border whitespace-nowrap ${item.status === 'resolved' || item.status === 'closed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                  >
                    {item.status === 'resolved' || item.status === 'closed' ? 'Đã xong' : 'Đang xử lý'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải (1 col): Danh bạ khẩn cấp */}
        <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3 min-w-0">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-200 pb-2.5 flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Đường dây nóng khẩn cấp</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Trực ban Công an Phường</div>
                <div className="text-[11px] text-slate-500 truncate">Tiếp nhận an ninh trật tự</div>
              </div>
              <a href="tel:02513822113" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                (0251) 3822.113
              </a>
            </div>

            <div className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Sự cố Điện lực Biên Hòa</div>
                <div className="text-[11px] text-slate-500 truncate">Đứt dây điện, mất điện</div>
              </div>
              <a href="tel:19001006" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                1900.1006
              </a>
            </div>

            <div className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-slate-800 truncate">Thoát nước & Cấp nước</div>
                <div className="text-[11px] text-slate-500 truncate">Vỡ đường ống, ngập sâu</div>
              </div>
              <a href="tel:02513822555" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                (0251) 3822.555
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

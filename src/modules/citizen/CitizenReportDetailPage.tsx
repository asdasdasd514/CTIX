import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types/incident';
import { CitizenRatingModal } from './CitizenRatingModal';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  ThumbsUp,
  User,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const CitizenReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, upvoteIncident } = useIncidentStore();
  const [showRatingModal, setShowRatingModal] = useState(false);

  const incident = incidents.find((item) => item.id === id);

  if (!incident) {
    return (
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Không tìm thấy hồ sơ phản ánh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hồ sơ này có thể không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
        </div>
        <button
          onClick={() => navigate('/citizen/reports')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-[5px] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách phản ánh</span>
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-[5px] border border-amber-300 inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Chờ tiếp nhận
          </span>
        );
      case 'assigned':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-[5px] border border-blue-300 whitespace-nowrap">
            Đã giao đơn vị
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-[5px] border border-indigo-300 inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Đang khắc phục
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-[5px] border border-emerald-300 inline-flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã hoàn thành
          </span>
        );
      case 'closed':
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-[5px] border border-slate-300 whitespace-nowrap">
            Đã nghiệm thu & Hài lòng
          </span>
        );
    }
  };

  const isResolved = incident.status === 'resolved' || incident.status === 'closed';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. THANH QUAY LẠI & HÀNH ĐỘNG */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
        <button
          onClick={() => navigate('/citizen/reports')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 px-3.5 py-2 rounded-[5px] border border-slate-300 transition"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Quay lại danh sách phản ánh</span>
        </button>

        <button
          onClick={() => upvoteIncident(incident.id)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-[5px] border border-blue-200 transition active:scale-[0.99]"
        >
          <ThumbsUp className="w-4 h-4 shrink-0" />
          <span>Tôi cũng thấy sự cố này (+{incident.sameReportsCount})</span>
        </button>
      </div>

      {/* 2. BỐ CỤC CHI TIẾT 2 CỘT (PC: 7/5 | MOBILE: 1 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): THÔNG TIN SỰ CỐ, ẢNH TRƯỚC/SAU & BẢN ĐỒ VỊ TRÍ */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Thông tin chính */}
          <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-[5px] border border-blue-200">
                  {incident.code}
                </span>
                {getStatusBadge(incident.status)}
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{new Date(incident.createdAt).toLocaleString('vi-VN')}</span>
              </span>
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug break-words">
                {incident.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                {incident.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-[5px] border border-slate-200 text-xs">
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Địa điểm hiện trường</span>
                  <span className="font-semibold text-slate-800 break-words">{incident.location.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Người gửi phản ánh</span>
                  <span className="font-semibold text-slate-800">{incident.sender?.name || 'Công dân Trấn Biên'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hình ảnh Trước - Sau */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
              Hình ảnh xác minh hiện trường (Trước & Sau)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-rose-700 block">
                  ● Ảnh lúc người dân báo cáo:
                </span>
                <div className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={incident.photosBefore[0]}
                    alt="Trước khi xử lý"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-700 block">
                  ● Ảnh nghiệm thu sau khi xử lý:
                </span>
                <div className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {incident.photosAfter && incident.photosAfter[0] ? (
                    <img
                      src={incident.photosAfter[0]}
                      alt="Sau khi xử lý"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      <Clock className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                      <span>Đơn vị đang triển khai khắc phục</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vị trí trên OpenStreetMap */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
              Vị trí sự cố trên bản đồ
            </h2>
            <div className="rounded-[5px] overflow-hidden border border-slate-200">
              <OpenStreetMap
                height="280px"
                center={[incident.location.lat, incident.location.lng]}
                zoom={16}
                singlePin={{
                  lat: incident.location.lat,
                  lng: incident.location.lng,
                  label: incident.location.address,
                }}
                incidents={[]}
                showLocateButton={false}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): TIẾN TRÌNH 4 BƯỚC & ĐÁNH GIÁ 5 SAO */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 min-w-0">
          {/* Tiến trình xử lý */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight border-b border-slate-200 pb-2.5">
              Tiến trình giải quyết của UBND Phường
            </h2>

            {incident.assignedTo && (
              <div className="p-3 rounded-[5px] bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-blue-900">Đơn vị phụ trách xử lý:</div>
                  <div className="text-blue-800 font-semibold mt-0.5">{incident.assignedTo.unitName}</div>
                </div>
              </div>
            )}

            <div className="space-y-4 text-xs sm:text-sm pt-1">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">1. Đã tiếp nhận phản ánh</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(incident.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-[5px] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    incident.assignedTo
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {incident.assignedTo ? '✓' : '2'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">2. Cán bộ phân công xử lý</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {incident.assignedTo
                      ? `Đã giao cho ${incident.assignedTo.unitName}`
                      : 'Đang thẩm định và xếp lịch kiểm tra'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-[5px] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isResolved
                      ? 'bg-emerald-600 text-white'
                      : incident.status === 'in_progress'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isResolved ? '✓' : '3'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">3. Đội kỹ thuật khắc phục hiện trường</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isResolved
                      ? 'Đã hoàn tất thi công và tải lên ảnh nghiệm thu'
                      : 'Đang triển khai trong thời hạn cam kết SLA (24h - 48h)'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-[5px] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    incident.rating
                      ? 'bg-emerald-600 text-white'
                      : incident.status === 'resolved'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {incident.rating ? '✓' : '4'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900">4. Đánh giá hài lòng của công dân</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {incident.rating
                      ? `Đã đánh giá: ${incident.rating.stars}/5 sao`
                      : 'Chờ người dân chấm điểm chất lượng phục vụ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Khu vực đánh giá 5 sao */}
            {isResolved && (
              <div className="pt-3 border-t border-slate-200">
                {incident.rating ? (
                  <div className="bg-amber-50 border border-amber-300 p-4 rounded-[5px] text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      {Array.from({ length: incident.rating.stars }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-amber-900">
                      Bạn đã đánh giá {incident.rating.stars}/5 sao
                    </div>
                    {incident.rating.comment && (
                      <p className="text-xs text-amber-800 italic break-words">
                        "{incident.rating.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-[5px] font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.99] text-xs sm:text-sm border border-amber-600 uppercase tracking-wide"
                  >
                    <Star className="w-4 h-4 fill-slate-900 shrink-0" />
                    <span>Đánh giá mức độ hài lòng (5 sao)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRatingModal && (
        <CitizenRatingModal
          incident={incident}
          onClose={() => setShowRatingModal(false)}
        />
      )}
    </div>
  );
};

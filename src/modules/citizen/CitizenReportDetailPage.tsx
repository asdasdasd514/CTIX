import React, { useState, useRef } from 'react';
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
  ImagePlus,
  FileEdit,
  XCircle,
  Save,
  X,
} from 'lucide-react';

export const CitizenReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    incidents,
    upvoteIncident,
    addIncidentPhotos,
    updateIncidentDescription,
    deleteIncident,
  } = useIncidentStore();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const addPhotoInputRef = useRef<HTMLInputElement | null>(null);

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
            Hồ sơ này có thể không tồn tại hoặc đã bị hủy khỏi hệ thống.
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

  const isResolved = incident.status === 'resolved' || incident.status === 'closed';

  const showToast = (msg: string) => {
    setActionMessage(msg);
    window.setTimeout(() => setActionMessage(null), 3500);
  };

  // 1. Chụp / tải thêm nhiều ảnh bổ sung hiện trường
  const handleAddExtraPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const readers = fileArray.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((urls) => {
      const validUrls = urls.filter(Boolean);
      if (validUrls.length > 0) {
        addIncidentPhotos(incident.id, validUrls);
        showToast(`Đã bổ sung thành công ${validUrls.length} ảnh hiện trường mới!`);
      }
      e.target.value = '';
    });
  };

  // 2. Mở form chỉnh sửa mô tả sự cố
  const handleStartEdit = () => {
    setEditTitle(incident.title);
    setEditDescription(incident.description);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDescription.trim()) return;
    updateIncidentDescription(incident.id, editDescription.trim(), editTitle.trim() || incident.title);
    setIsEditing(false);
    showToast('Đã cập nhật mô tả sự cố thành công!');
  };

  // 3. Hủy yêu cầu phản ánh này
  const handleCancelReport = () => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy yêu cầu phản ánh ${incident.code} không? Thao tác này không thể hoàn tác.`
    );
    if (confirmed) {
      deleteIncident(incident.id);
      navigate('/citizen/reports');
    }
  };

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

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. THANH QUAY LẠI & ĐỒNG PHẢN ÁNH */}
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

      {/* Thông báo nhanh khi bổ sung ảnh / chỉnh sửa */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-[5px] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. BỐ CỤC CHI TIẾT 2 CỘT (PC: 7/5 | MOBILE: 1 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): THÔNG TIN SỰ CỐ, GALLERY ẢNH & BẢN ĐỒ */}
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

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3 bg-blue-50/50 p-4 rounded-[5px] border border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề phản ánh:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết sự cố:</label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-[5px] text-xs font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu thay đổi
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug break-words">
                  {incident.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {incident.description}
                </p>
              </div>
            )}

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

          {/* Hình ảnh Trước - Sau (Hỗ trợ hiển thị nhiều ảnh hiện trường) */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                Hình ảnh xác minh hiện trường
              </h2>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                {incident.photosBefore.length} ảnh báo cáo
              </span>
            </div>

            {/* Danh sách tất cả ảnh người dân gửi */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-700 block">
                ● Ảnh lúc người dân báo cáo ({incident.photosBefore.length} ảnh):
              </span>
              <div
                className={`grid gap-2.5 ${
                  incident.photosBefore.length === 1
                    ? 'grid-cols-1'
                    : incident.photosBefore.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {incident.photosBefore.map((src, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200 relative group"
                  >
                    <img
                      src={src}
                      alt={`Ảnh hiện trường ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-slate-900/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ảnh nghiệm thu sau khi xử lý */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-emerald-700 block">
                ● Ảnh nghiệm thu sau khi xử lý:
              </span>
              {incident.photosAfter && incident.photosAfter.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {incident.photosAfter.map((src, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200"
                    >
                      <img src={src} alt={`Sau xử lý ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-[5px] bg-slate-50 border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                  <span>Đơn vị đang triển khai khắc phục — chưa có ảnh nghiệm thu</span>
                </div>
              )}
            </div>
          </div>

          {/* Vị trí trên bản đồ */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
              Vị trí sự cố trên bản đồ
            </h2>
            <div className="rounded-[5px] overflow-hidden border border-slate-200 h-[300px]">
              <OpenStreetMap
                key={incident.id}
                height="100%"
                className="h-full"
                mode="citizen"
                center={[incident.location.lat, incident.location.lng]}
                zoom={16}
                singlePin={{
                  lat: incident.location.lat,
                  lng: incident.location.lng,
                  label: incident.location.address,
                }}
                showLocateButton={false}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): TIẾN TRÌNH 4 BƯỚC + 3 NÚT HÀNH ĐỘNG CHO HỒ SƠ CHƯA XỬ LÝ */}
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

            {/* 3 NÚT HÀNH ĐỘNG CHO PHẢN ÁNH CHƯA XỬ LÝ (THEO ĐÚNG MẪU) */}
            {!isResolved && (
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <input
                  type="file"
                  ref={addPhotoInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleAddExtraPhotos}
                  className="hidden"
                />

                {/* Nút 1: Chụp thêm ảnh bổ sung hiện trường */}
                <button
                  type="button"
                  onClick={() => addPhotoInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-200/80 hover:bg-slate-200 text-blue-900 rounded-[5px] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <ImagePlus className="w-4 h-4 text-blue-800 shrink-0" />
                  <span>Chụp thêm ảnh bổ sung hiện trường</span>
                </button>

                {/* Nút 2: Chỉnh sửa mô tả sự cố */}
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-900 rounded-[5px] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <FileEdit className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>Chỉnh sửa mô tả sự cố</span>
                </button>

                {/* Nút 3: Hủy yêu cầu phản ánh này */}
                <button
                  type="button"
                  onClick={handleCancelReport}
                  className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-red-700 rounded-[5px] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Hủy yêu cầu phản ánh này</span>
                </button>
              </div>
            )}

            {/* Khu vực đánh giá 5 sao (khi đã xử lý xong) */}
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

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { mediaApi } from '../../services/api';
import { distanceMeters, isPublicIncident } from '../../lib/incidents';
import { getGuestPhone, getGuestReportIds, normalizePhone } from '../../lib/guestReports';
import { compressImageFiles } from '../../lib/imageCompress';
import { Incident, IncidentCategory, IncidentLocation } from '../../types/incident';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import { BeforeAfterSlider } from '../../components/common/BeforeAfterSlider';
import { TimestampWatermark } from '../../components/common/TimestampWatermark';
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
  FileEdit,
  XCircle,
  Save,
  X,
  Send,
  Plus,
  Locate,
} from 'lucide-react';

const RATING_CRITERIA = [
  'Xử lý nhanh chóng, đúng hạn',
  'Hiện trường sạch sẽ, triệt để',
  'Cán bộ / thợ kỹ thuật nhiệt tình',
  'Tiến độ rõ ràng, minh bạch',
];

const CATEGORY_CHOICES: { id: IncidentCategory; label: string }[] = [
  { id: 'street_light', label: 'Đèn đường chiếu sáng' },
  { id: 'flooding', label: 'Ngập nước sau mưa' },
  { id: 'waste', label: 'Rác thải tự phát' },
  { id: 'road_damage', label: 'Mặt đường & Ổ gà' },
  { id: 'other', label: 'Sự cố khác' },
];

export const CitizenReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    incidents,
    upvoteIncident,
    updateIncident,
    deleteIncident,
    rateIncident,
  } = useIncidentStore();
  const { isAuthenticated, currentUser } = useAuthStore();

  const incident = incidents.find((item) => item.id === id);

  // Kiểm tra chính chủ hồ sơ:
  // - Đã đăng nhập: chỉ khớp DUY NHẤT bằng SĐT tài khoản (tách bạch hoàn toàn với phiên khách)
  // - Chưa đăng nhập (Khách): chỉ khớp khi bài được gửi từ chính thiết bị này
  const isOwner = (() => {
    if (!incident) return false;
    const senderPhone = normalizePhone(incident.sender?.phone);
    if (isAuthenticated) {
      if (currentUser.role !== 'citizen') return true;
      const myPhone = normalizePhone(currentUser.phone);
      return Boolean(myPhone && senderPhone && myPhone === senderPhone);
    }
    const guestIds = getGuestReportIds();
    return guestIds.includes(incident.id);
  })();
  const requesterPhone = isAuthenticated
    ? currentUser.phone
    : getGuestPhone() || incident?.sender?.phone;

  // Chế độ chỉnh sửa toàn bộ hồ sơ (Thông tin + Loại sự cố + Nhiều ảnh + Vị trí bản đồ)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<IncidentCategory>('street_light');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editLocation, setEditLocation] = useState<IncidentLocation>({
    lat: 10.9572,
    lng: 106.8184,
    address: '',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // State đánh giá sao tương tác trực tiếp
  const [ratingStars, setRatingStars] = useState<number>(incident?.rating?.stars || 5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(
    incident?.rating?.criteria || ['Xử lý nhanh chóng, đúng hạn']
  );
  const [ratingComment, setRatingComment] = useState<string>(incident?.rating?.comment || '');
  const [isEditingRating, setIsEditingRating] = useState<boolean>(!incident?.rating);

  useEffect(() => {
    if (incident) {
      setRatingStars(incident.rating?.stars || 5);
      setSelectedCriteria(incident.rating?.criteria || ['Xử lý nhanh chóng, đúng hạn']);
      setRatingComment(incident.rating?.comment || '');
      setIsEditingRating(!incident.rating);
      setIsEditing(false);
    }
  }, [incident?.id]);

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

  // Mở chế độ Chỉnh sửa hồ sơ (chỉ chính chủ khi đang Chờ duyệt)
  const handleStartEdit = () => {
    if (!isOwner || incident.status !== 'pending_review') return;
    setEditTitle(incident.title);
    setEditDescription(incident.description);
    setEditCategory(incident.category);
    setEditPhotos([...incident.photosBefore]);
    setEditLocation({ ...incident.location });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Thêm nhiều ảnh khi đang chỉnh sửa hồ sơ (nén ảnh + upload vào đúng thư mục Cloudinary theo category)
  const handleEditAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = await compressImageFiles(Array.from(files));
    try {
      const uploadedUrls = await mediaApi.uploadFiles(fileList, 'before', editCategory);
      if (uploadedUrls.length > 0) {
        setEditPhotos((prev) => [...prev, ...uploadedUrls]);
        e.target.value = '';
        return;
      }
    } catch {
      // Fallback sang FileReader khi backend chưa bật
    }

    const readers = fileList.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((urls) => {
      const valid = urls.filter(Boolean);
      if (valid.length > 0) {
        setEditPhotos((prev) => [...prev, ...valid]);
      }
      e.target.value = '';
    });
  };

  const handleEditRemovePhoto = (idx: number) => {
    setEditPhotos((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  // Chọn lại vị trí trên bản đồ khi đang chỉnh sửa hồ sơ
  const handleEditMapClick = async (lat: number, lng: number) => {
    setEditLocation((prev) => ({
      ...prev,
      lat,
      lng,
      address: `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}) • Đang tìm địa chỉ...`,
    }));
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          const shortAddr = data.display_name.split(',').slice(0, 3).join(', ');
          setEditLocation({
            lat,
            lng,
            address: `${shortAddr}, Phường Trấn Biên`,
            ward: 'Phường Trấn Biên',
          });
        }
      }
    } catch {
      setEditLocation({
        lat,
        lng,
        address: `Khu vực tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}), Phường Trấn Biên`,
        ward: 'Phường Trấn Biên',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleEditGetGPS = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          handleEditMapClick(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setIsLocating(false);
          handleEditMapClick(10.9572, 106.8184);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      handleEditMapClick(10.9572, 106.8184);
    }
  };

  // Lưu toàn bộ thay đổi hồ sơ (chỉ chính chủ)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || incident.status !== 'pending_review') return;
    if (!editTitle.trim() || !editDescription.trim()) return;
    updateIncident(
      incident.id,
      {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        photosBefore: editPhotos.length > 0 ? editPhotos : incident.photosBefore,
        location: editLocation,
      },
      requesterPhone
    );
    setIsEditing(false);
    showToast('Đã cập nhật toàn bộ hồ sơ phản ánh thành công!');
  };

  // Hủy yêu cầu phản ánh này (chỉ chính chủ)
  const handleCancelReport = () => {
    if (!isOwner || incident.status !== 'pending_review') return;
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy yêu cầu phản ánh này không? Thao tác này không thể hoàn tác.'
    );
    if (confirmed) {
      deleteIncident(incident.id, requesterPhone);
      navigate('/citizen/reports', { state: { onlyMyReports: true } });
    }
  };

  // Lưu đánh giá sao trực tiếp
  const toggleCriteria = (item: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    rateIncident(incident.id, ratingStars, selectedCriteria, ratingComment.trim());
    setIsEditingRating(false);
    showToast(`Cảm ơn bạn đã đánh giá ${ratingStars}/5 sao cho kết quả xử lý!`);
  };

  const getCategoryLabel = (cat: Incident['category']) => {
    switch (cat) {
      case 'street_light':
        return 'Đèn đường chiếu sáng';
      case 'flooding':
        return 'Ngập nước sau mưa';
      case 'waste':
        return 'Rác thải tự phát';
      case 'road_damage':
        return 'Mặt đường & Ổ gà';
      case 'other':
        return 'Sự cố khác';
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

  const activeStarValue = hoverStars || ratingStars;

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

      {/* Thông báo nhanh */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-[5px] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. BỐ CỤC CHI TIẾT 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): CHẾ ĐỘ XEM HOẶC CHẾ ĐỘ CHỈNH SỬA TOÀN BỘ HỒ SƠ */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {isEditing ? (
            <form
              onSubmit={handleSaveEdit}
              className="bg-white rounded-[5px] border-2 border-blue-600 shadow-sm p-4 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-blue-900 flex items-center gap-2">
                    <FileEdit className="w-5 h-5 text-blue-700 shrink-0" />
                    <span>Chỉnh Sửa Hồ Sơ Phản Ánh</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cập nhật lại thông tin, loại sự cố, bổ sung/xóa ảnh hoặc chọn lại vị trí trên bản đồ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-[5px]"
                  aria-label="Đóng chỉnh sửa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loại sự cố */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Loại sự cố:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_CHOICES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setEditCategory(c.id)}
                      className={`px-3 py-1.5 rounded-[5px] text-xs font-bold border transition ${
                        editCategory === c.id
                          ? 'bg-blue-700 text-white border-blue-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu đề & Mô tả */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tiêu đề phản ánh: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mô tả chi tiết sự cố: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Chỉnh sửa / Tải thêm ảnh hiện trường */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Ảnh hiện trường ({editPhotos.length} ảnh):
                  </label>
                  <button
                    type="button"
                    onClick={() => editPhotoInputRef.current?.click()}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tải thêm ảnh
                  </button>
                </div>

                <input
                  type="file"
                  ref={editPhotoInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleEditAddPhotos}
                  className="hidden"
                />

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {editPhotos.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-[5px] overflow-hidden border border-slate-300 bg-slate-100"
                    >
                      <img src={src} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                      {editPhotos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEditRemovePhoto(idx)}
                          aria-label="Xóa ảnh"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => editPhotoInputRef.current?.click()}
                    className="aspect-square rounded-[5px] border-2 border-dashed border-blue-300 bg-blue-50/70 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center gap-1 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Thêm ảnh</span>
                  </button>
                </div>
              </div>

              {/* Chỉnh sửa vị trí trên bản đồ */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Vị trí sự cố (nhấp vào bản đồ để đổi điểm ghim):
                  </label>
                  <button
                    type="button"
                    onClick={handleEditGetGPS}
                    disabled={isLocating}
                    className="px-3 py-1.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Đang định vị...' : 'Lấy vị trí hiện tại'}</span>
                  </button>
                </div>

                <div className="rounded-[5px] overflow-hidden border border-slate-300 h-[280px]">
                  <OpenStreetMap
                    height="100%"
                    className="h-full"
                    mode="citizen"
                    center={[editLocation.lat, editLocation.lng]}
                    zoom={16}
                    singlePin={{
                      lat: editLocation.lat,
                      lng: editLocation.lng,
                      label: editLocation.address,
                    }}
                    onMapClick={handleEditMapClick}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Địa chỉ cụ thể:</span>
                    {isGeocoding && (
                      <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                        Đang nhận diện địa chỉ...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editLocation.address}
                    onChange={(e) => setEditLocation({ ...editLocation, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Nút Lưu / Hủy */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-white border border-slate-300 rounded-[5px] text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Hủy chỉnh sửa</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu cập nhật hồ sơ</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Thông tin chính */}
              <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-[5px] border border-blue-200">
                      {getCategoryLabel(incident.category)}
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
              <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    Hình ảnh xác minh hiện trường
                  </h2>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                    {incident.photosBefore.length} ảnh báo cáo
                  </span>
                </div>

                {incident.photosBefore.length > 0 &&
                incident.photosAfter &&
                incident.photosAfter.length > 0 ? (
                  <BeforeAfterSlider
                    photosBefore={incident.photosBefore}
                    photosAfter={incident.photosAfter}
                    beforeTimestamp={incident.createdAt}
                    afterTimestamp={incident.resolution?.resolvedAt || incident.updatedAt}
                    address={incident.location.address}
                  />
                ) : (
                  <>
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
                            className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200 relative"
                          >
                            <img
                              src={src}
                              alt={`Ảnh hiện trường ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <TimestampWatermark
                              timestamp={incident.createdAt}
                              address={incident.location.address}
                              imageUrl={src}
                              compact={incident.photosBefore.length > 1}
                            />
                            <span className="absolute top-1.5 right-1.5 z-20 bg-slate-900/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

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
                  </>
                )}
              </div>

              {/* Vị trí trên bản đồ */}
              <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
                <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                  Vị trí sự cố trên bản đồ
                </h2>
                <div className="rounded-[5px] overflow-hidden border border-slate-200 h-[300px]">
                  <OpenStreetMap
                    key={`${incident.id}-${incident.location.lat}-${incident.location.lng}`}
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

              {/* CÁC PHẢN ÁNH CÙNG HIỆN TRƯỜNG ĐÃ GỘP (ẨN SĐT ĐỂ BẢO MẬT CÔNG DÂN) */}
              {incident.linkedReports && incident.linkedReports.length > 0 && (
                <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Các phản ánh cùng hiện trường đã gộp ({incident.linkedReports.length})
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-800 border border-amber-200">
                      🔥 {incident.sameReportsCount} người cùng phản ánh
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {incident.linkedReports.map((lr, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 flex items-start gap-3"
                      >
                        {lr.photos?.[0] && (
                          <img
                            src={lr.photos[0]}
                            alt={`Góc chụp bổ sung ${idx + 1}`}
                            className="w-16 h-16 rounded-[5px] object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="font-semibold text-slate-800">
                            {lr.sender?.name || 'Công dân Phường Trấn Biên'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Báo bổ sung lúc {new Date(lr.reportedAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẢN ÁNH TƯƠNG TỰ QUANH ĐÂY (TRONG BÁN KÍNH 50M) */}
              {(() => {
                const nearbyPublic = incidents
                  .filter(
                    (other) =>
                      other.id !== incident.id &&
                      isPublicIncident(other) &&
                      other.status !== 'resolved' &&
                      other.status !== 'closed'
                  )
                  .map((other) => ({
                    other,
                    dist: Math.round(distanceMeters(incident.location, other.location)),
                  }))
                  .filter((x) => x.dist <= 50)
                  .sort((a, b) => a.dist - b.dist)
                  .slice(0, 4);

                if (nearbyPublic.length === 0) return null;
                return (
                  <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Phản ánh gần vị trí này (trong bán kính 50m)
                    </h3>
                    <div className="space-y-2">
                      {nearbyPublic.map(({ other, dist }) => (
                        <button
                          key={other.id}
                          type="button"
                          onClick={() => navigate(`/citizen/reports/${other.id}`)}
                          className="w-full text-left p-2.5 rounded-[5px] bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 flex items-center gap-3 transition"
                        >
                          {other.photosBefore[0] && (
                            <img
                              src={other.photosBefore[0]}
                              alt=""
                              className="w-12 h-12 rounded-[5px] object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {other.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Cách {dist}m • {other.location.address}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* CỘT PHẢI (5/12): TIẾN TRÌNH 4 BƯỚC + NÚT CHỈNH SỬA HỒ SƠ / ĐÁNH GIÁ SAO */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 min-w-0">
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
                    incident.assignedTo ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
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
                  {incident.workflowSteps && incident.workflowSteps.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-[5px] bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Các bước khắc phục tại hiện trường</span>
                        <span className="text-blue-700">
                          {incident.workflowSteps.filter((s) => s.completed).length}/
                          {incident.workflowSteps.length}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {incident.workflowSteps.map((step, idx) => (
                          <li key={step.id} className="flex items-start gap-1.5 text-[11px]">
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 ${
                                step.completed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {step.completed ? '✓' : idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span
                                className={
                                  step.completed
                                    ? 'text-slate-700 font-medium'
                                    : 'text-slate-500'
                                }
                              >
                                {step.title}
                              </span>
                              {step.completedAt && (
                                <span className="block text-[10px] text-emerald-700">
                                  Hoàn thành: {new Date(step.completedAt).toLocaleString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {isResolved && (
                    <div className="mt-1.5 inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-[4px] text-[11px] font-bold">
                      <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>
                        Hoàn thành:{' '}
                        {new Date(incident.resolution?.resolvedAt || incident.updatedAt).toLocaleString('vi-VN')}
                      </span>
                      <span className="text-emerald-600">
                        (
                        {Math.max(
                          0.1,
                          (new Date(incident.resolution?.resolvedAt || incident.updatedAt).getTime() -
                            new Date(incident.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                          .toFixed(1)
                          .replace('.', ',')}{' '}
                        ngày)
                      </span>
                    </div>
                  )}
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

            {/* THÔNG BÁO CHỜ DUYỆT HOẶC TỪ CHỐI TIẾP NHẬN */}
            {incident.status === 'pending_review' && (
              <div className="p-3.5 rounded-[5px] bg-violet-50 border border-violet-200 text-xs text-violet-900 space-y-1">
                <div className="font-bold">Đang chờ UBND Phường kiểm duyệt tiếp nhận</div>
                <p className="text-violet-700 leading-relaxed">
                  {isOwner
                    ? 'Phản ánh của bạn đã được ghi nhận và đang chờ cán bộ xác thực trước khi công khai & phân công xử lý. Bạn vẫn có thể chỉnh sửa hoặc hủy trong thời gian này.'
                    : 'Phản ánh này đang chờ UBND Phường kiểm duyệt tiếp nhận.'}
                </p>
              </div>
            )}

            {incident.status === 'rejected' && (
              <div className="p-3.5 rounded-[5px] bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="font-bold">Phản ánh không được tiếp nhận</div>
                <p className="text-rose-700 leading-relaxed">
                  <strong>Lý do:</strong>{' '}
                  {incident.review?.reason || 'Không đủ thông tin hoặc ngoài phạm vi xử lý của Phường Trấn Biên.'}
                </p>
              </div>
            )}

            {/* 2 NÚT HÀNH ĐỘNG CHỈ HIỆN CHO CHÍNH CHỦ KHI HỒ SƠ ĐANG CHỜ DUYỆT */}
            {incident.status === 'pending_review' && isOwner && (
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={isEditing}
                  className="w-full py-3 px-4 bg-slate-200/80 hover:bg-slate-200 disabled:opacity-60 text-blue-900 rounded-[5px] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <FileEdit className="w-4 h-4 text-blue-800 shrink-0" />
                  <span>{isEditing ? 'Đang chỉnh sửa hồ sơ...' : 'Chỉnh sửa hồ sơ'}</span>
                </button>

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

            {/* KHU VỰC ĐÁNH GIÁ SAO TƯƠNG TÁC TRỰC TIẾP (CHO PHẢN ÁNH ĐÃ XỬ LÝ) */}
            {isResolved && (
              <div className="pt-4 border-t border-slate-200">
                {!isEditingRating && incident.rating ? (
                  <div className="bg-amber-50/90 border border-amber-200 p-4 rounded-[5px] space-y-2.5 text-center">
                    <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                      Đánh giá của bạn về kết quả xử lý
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setRatingStars(star);
                            setIsEditingRating(true);
                          }}
                          title="Bấm để thay đổi số sao đánh giá"
                          className="p-0.5 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= incident.rating!.stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="font-bold text-xs sm:text-sm text-amber-900">
                      {incident.rating.stars}/5 sao •{' '}
                      {incident.rating.stars === 5
                        ? 'Rất hài lòng'
                        : incident.rating.stars === 4
                        ? 'Hài lòng'
                        : incident.rating.stars === 3
                        ? 'Bình thường'
                        : 'Cần cải thiện'}
                    </div>

                    {incident.rating.comment && (
                      <p className="text-xs text-amber-800 italic break-words">
                        "{incident.rating.comment}"
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsEditingRating(true)}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-[5px] text-xs font-bold transition"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Đánh giá lại / Chỉnh sửa nhận xét</span>
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitRating}
                    className="bg-amber-50/70 border border-amber-200 p-4 rounded-[5px] space-y-3.5"
                  >
                    <div className="text-center space-y-1.5">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        Chạm chọn số sao đánh giá mức độ hài lòng:
                      </div>

                      <div
                        className="flex items-center justify-center gap-1.5 py-1"
                        onMouseLeave={() => setHoverStars(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverStars(star)}
                            onClick={() => setRatingStars(star)}
                            className="p-1 hover:scale-115 active:scale-95 transition focus:outline-none"
                            aria-label={`Đánh giá ${star} sao`}
                          >
                            <Star
                              className={`w-8 h-8 transition-colors ${
                                star <= activeStarValue
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                  : 'text-slate-300 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <div className="text-xs font-extrabold text-amber-700">
                        {activeStarValue === 5 && '5/5 sao — Rất hài lòng'}
                        {activeStarValue === 4 && '4/5 sao — Hài lòng'}
                        {activeStarValue === 3 && '3/5 sao — Bình thường'}
                        {activeStarValue === 2 && '2/5 sao — Chưa hài lòng'}
                        {activeStarValue === 1 && '1/5 sao — Rất không hài lòng'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {RATING_CRITERIA.map((item) => {
                        const checked = selectedCriteria.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleCriteria(item)}
                            className={`px-2.5 py-1 rounded-[5px] text-[11px] font-bold border transition ${
                              checked
                                ? 'bg-blue-700 text-white border-blue-800'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                            }`}
                          >
                            {checked ? '✓ ' : '+ '}
                            {item}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      rows={2}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Nhập nhận xét hoặc góp ý thêm cho UBND Phường..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-[5px] text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />

                    <div className="flex items-center gap-2">
                      {incident.rating && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRating(false)}
                          className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-[5px] text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Hủy
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs sm:text-sm font-black shadow-sm transition flex items-center justify-center gap-1.5 active:scale-[0.99]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi đánh giá ({ratingStars} sao)</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

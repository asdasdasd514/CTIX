import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  ListChecks,
  MapPin,
  Navigation,
  Phone,
  Play,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { IncidentResolutionModal } from './IncidentResolutionModal';
import { BeforeAfterSlider } from '../../components/common/BeforeAfterSlider';
import { TimestampWatermark } from '../../components/common/TimestampWatermark';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  deadlineLabel,
  formatDate,
  getAssigneeLabel,
  isComplete,
  isOverdue,
} from '../../lib/incidents';

export function FieldTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    incidents,
    verifyIncident,
    startIncident,
    toggleWorkflowStep,
    refreshIncidents,
  } = useIncidentStore();
  const { currentUser } = useAuthStore();

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void refreshIncidents();
  }, [refreshIncidents]);

  const item = incidents.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Không tìm thấy hồ sơ nhiệm vụ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hồ sơ này có thể không tồn tại hoặc chưa được đồng bộ.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/field-tasks')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách nhiệm vụ</span>
        </button>
      </div>
    );
  }

  const overdue = isOverdue(item);
  const completed = isComplete(item);
  const steps = item.workflowSteps || [];
  const doneSteps = steps.filter((s) => s.completed).length;
  const progressPct = steps.length > 0 ? Math.round((doneSteps / steps.length) * 100) : 0;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.location.lat},${item.location.lng}`;
  const activeBeforePhoto =
    item.photosBefore[Math.min(activePhotoIdx, Math.max(0, item.photosBefore.length - 1))];

  const act = (action: () => void, text: string) => {
    setError('');
    try {
      action();
      setMessage(text);
      window.setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. THANH ĐIỀU HƯỚNG & TIÊU ĐỀ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/field-tasks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách nhiệm vụ</span>
            </Link>
            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-[5px] bg-slate-100 text-slate-800 border border-slate-200">
              {item.code}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-[5px] bg-blue-50 text-blue-800 border border-blue-200">
              {CATEGORIES[item.category]}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-[5px] border ${
                item.priority === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : item.priority === 'high'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {PRIORITY_LABELS[item.priority]}
            </span>
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-[5px] border ${
                completed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : overdue
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : item.status === 'in_progress'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {overdue && !completed ? '⚠ Quá hạn SLA' : STATUS_LABELS[item.status]}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
            {item.title}
          </h1>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition"
        >
          <Navigation className="w-4 h-4 text-blue-700" />
          <span>Chỉ đường Google Maps</span>
        </a>
      </div>

      {/* Thông báo thao tác */}
      {message && (
        <div
          role="status"
          className="p-3 rounded-[5px] bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. BỐ CỤC 2 CỘT: CHI TIẾT HIỆN TRƯỜNG (TRÁI) & QUY TRÌNH XỬ LÝ (PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): ẢNH HIỆN TRƯỜNG, MÔ TẢ, BẢN ĐỒ */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          {/* Ảnh hiện trường / Thanh trượt Trước - Sau */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 space-y-3">
            {completed &&
            item.photosBefore.length > 0 &&
            item.photosAfter &&
            item.photosAfter.length > 0 ? (
              <BeforeAfterSlider
                photosBefore={item.photosBefore}
                photosAfter={item.photosAfter}
                beforeTimestamp={item.createdAt}
                afterTimestamp={item.resolution?.resolvedAt || item.updatedAt}
                address={item.location.address}
              />
            ) : (
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">
                  Ảnh hiện trường tiếp nhận ({item.photosBefore.length} ảnh)
                </div>
                {activeBeforePhoto ? (
                  <div className="relative aspect-[16/10] w-full rounded-[5px] overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={activeBeforePhoto}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <TimestampWatermark
                      timestamp={item.createdAt}
                      address={item.location.address}
                      imageUrl={activeBeforePhoto}
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] rounded-[5px] border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    Hồ sơ chưa có ảnh đính kèm
                  </div>
                )}

                {item.photosBefore.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {item.photosBefore.map((src, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`w-14 h-14 rounded-[5px] overflow-hidden border-2 shrink-0 transition ${
                          idx === activePhotoIdx
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={src} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thông tin chi tiết sự cố & Người phản ánh */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3.5">
            <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
              Nội dung phản ánh & Vị trí
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ hiện trường</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{item.location.address}</div>
                </div>
              </div>
              <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Người phản ánh</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{item.sender.name}</div>
                  <div className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5 font-mono">
                    <Phone className="w-3 h-3" />
                    {item.sender.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Bản đồ vị trí */}
            <div className="rounded-[5px] overflow-hidden border border-slate-200 h-[240px]">
              <OpenStreetMap
                height="240px"
                incidents={[item]}
                selectedId={item.id}
                center={[item.location.lat, item.location.lng]}
                zoom={16}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): THÔNG TIN GIAO VIỆC, QUY TRÌNH SOP & NGHIỆM THU */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 min-w-0">
          {/* Thông tin phân công & Hạn SLA */}
          {item.assignedTo && (
            <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-black text-slate-900">Thông tin giao nhiệm vụ</h2>
                {item.verifiedByVolunteer && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Đã xác minh
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{item.assignedTo.unitName}</span>
                </div>
                <div className="text-slate-600">
                  Cán bộ phụ trách:{' '}
                  <strong className="text-slate-900">{getAssigneeLabel(item.assignedTo)}</strong>
                </div>
                <div
                  className={`p-2.5 rounded-[5px] border flex items-center justify-between gap-2 font-bold ${
                    overdue && !completed
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" />
                    {deadlineLabel(item)}
                  </span>
                  <span className="text-[11px] font-semibold">
                    Hạn: {formatDate(item.assignedTo.deadline)}
                  </span>
                </div>
                {item.assignedTo.notes && (
                  <div className="p-2.5 rounded-[5px] bg-blue-50/70 border border-blue-200 text-blue-950">
                    <div className="text-[10px] font-bold uppercase text-blue-700 mb-0.5">
                      Chỉ đạo của cán bộ điều phối
                    </div>
                    <p className="text-xs leading-relaxed">“{item.assignedTo.notes}”</p>
                  </div>
                )}
                {item.verifiedByVolunteer && item.verificationNotes && (
                  <div className="p-2.5 rounded-[5px] bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                    <div className="text-[10px] font-bold uppercase text-emerald-700 mb-0.5">
                      Ghi chú xác minh hiện trường
                    </div>
                    <p className="text-xs">{item.verificationNotes}</p>
                  </div>
                )}
              </div>

              {/* Nút hành động chính */}
              {!completed && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  {item.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={() =>
                        act(
                          () => startIncident(item.id),
                          `Đã nhận việc và chuyển hồ sơ ${item.code} sang Đang xử lý hiện trường.`
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Play className="w-4 h-4" />
                      <span>Nhận việc & Bắt đầu xử lý</span>
                    </button>
                  )}

                  {item.status === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => setShowResolveModal(true)}
                      className="w-full py-2.5 px-4 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Hoàn thành & Tải ảnh nghiệm thu</span>
                    </button>
                  )}

                  {!item.verifiedByVolunteer && !showVerifyForm && (
                    <button
                      type="button"
                      onClick={() => setShowVerifyForm(true)}
                      className="w-full py-2 px-3 rounded-[5px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition"
                    >
                      Xác minh thực tế tại hiện trường
                    </button>
                  )}

                  {showVerifyForm && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(() => {
                          verifyIncident(
                            item.id,
                            verifyNotes.trim() || 'Đã có mặt kiểm tra và xác nhận đúng hiện trường.'
                          );
                          setShowVerifyForm(false);
                          setVerifyNotes('');
                        }, `Đã ghi nhận xác minh hiện trường cho hồ sơ ${item.code}.`);
                      }}
                      className="p-3 rounded-[5px] bg-amber-50 border border-amber-300 space-y-2"
                    >
                      <label className="block text-xs font-bold text-amber-950">
                        Ghi chú xác minh tại hiện trường:
                      </label>
                      <input
                        type="text"
                        value={verifyNotes}
                        onChange={(e) => setVerifyNotes(e.target.value)}
                        placeholder="Ví dụ: Đã đến hiện trường, xác nhận đúng sự cố..."
                        className="w-full px-3 py-2 rounded-[5px] border border-amber-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowVerifyForm(false);
                            setVerifyNotes('');
                          }}
                          className="px-3 py-1.5 rounded-[5px] bg-white border border-slate-300 text-xs font-semibold text-slate-700"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-[5px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                        >
                          Lưu xác minh
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bảng Quy trình SOP Hiện trường — CHỈ TICK BÊN TRONG TRANG CHI TIẾT */}
          {steps.length > 0 && (
            <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-900 inline-flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-blue-700" />
                  <span>Quy trình xử lý hiện trường (SOP)</span>
                </h2>
                <span className="text-xs font-extrabold text-blue-700">
                  {doneSteps}/{steps.length} ({progressPct}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {item.status === 'assigned' && (
                <div className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-[5px] px-3 py-2">
                  Hãy bấm <strong>“Nhận việc & Bắt đầu xử lý”</strong> ở trên để mở khóa tick hoàn thành từng bước.
                </div>
              )}

              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const canToggle = item.status === 'in_progress';
                  return (
                    <label
                      key={step.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-[5px] border text-xs transition ${
                        step.completed
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : canToggle
                          ? 'bg-white border-slate-200 hover:border-blue-400 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 opacity-80 cursor-default'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={step.completed}
                        disabled={!canToggle}
                        onChange={() => toggleWorkflowStep(item.id, step.id, currentUser.name)}
                        className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={
                            step.completed
                              ? 'line-through text-slate-500 font-medium'
                              : 'text-slate-900 font-semibold'
                          }
                        >
                          Bước {idx + 1}: {step.title}
                        </div>
                        {step.completedAt && (
                          <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                            ✓ {step.completedBy || currentUser.name} • {formatDate(step.completedAt)}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kết quả nghiệm thu khi đã hoàn thành */}
          {completed && item.resolution && (
            <div className="bg-emerald-50 rounded-[5px] border border-emerald-200 p-4 space-y-1.5 text-xs">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kết quả nghiệm thu hoàn thành</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">{item.resolution.notes}</p>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Hoàn thành lúc: {formatDate(item.resolution.resolvedAt)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nghiệm thu Before - After */}
      {showResolveModal && (
        <IncidentResolutionModal
          incident={item}
          onClose={() => setShowResolveModal(false)}
        />
      )}
    </div>
  );
}

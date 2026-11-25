import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  ClipboardCheck,
  Play,
  AlertTriangle,
  UserCheck,
  Clock,
  Navigation,
  Building2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { IncidentResolutionModal } from './IncidentResolutionModal';
import { BeforeAfterSlider } from '../../components/common/BeforeAfterSlider';
import {
  CATEGORIES,
  STATUS_LABELS,
  UNASSIGNED_STAFF_LABEL,
  deadlineLabel,
  formatDate,
  getAllKnownAssignees,
  getAllKnownUnits,
  getAssigneeLabel,
  isComplete,
  isOverdue,
} from '../../lib/incidents';

type FieldTab = 'assigned' | 'completed';

export function FieldTasksPage() {
  const {
    incidents,
    verifyIncident,
    startIncident,
    toggleWorkflowStep,
    refreshIncidents,
  } = useIncidentStore();
  const { currentUser } = useAuthStore();
  const isFieldStaff = currentUser.role === 'volunteer';

  const [searchParams] = useSearchParams();
  const linkedId = searchParams.get('id');
  const linkedIncident = linkedId
    ? incidents.find((i) => i.id === linkedId)
    : undefined;

  useEffect(() => {
    void refreshIncidents();
  }, [refreshIncidents]);

  const [tabState, setTabState] = useState<{
    linked: string | null;
    current: FieldTab;
  }>({
    linked: linkedId,
    current: linkedIncident && isComplete(linkedIncident) ? 'completed' : 'assigned',
  });
  const derivedLinkedTab: FieldTab =
    linkedIncident && isComplete(linkedIncident) ? 'completed' : 'assigned';
  const tab =
    tabState.linked === linkedId ? tabState.current : derivedLinkedTab;
  const setTab = (next: FieldTab) =>
    setTabState({ linked: linkedId, current: next });

  const [unitFilter, setUnitFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const highlightedCardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!linkedIncident) return;
    window.requestAnimationFrame(() => {
      highlightedCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }, [linkedIncident]);

  // Phạm vi cơ bản:
  // - Tài khoản Tổ xử lý (volunteer): tự động giới hạn đúng nhiệm vụ của Tổ hoặc cá nhân mình
  // - Quản trị/Điều phối (officer/leader): xem toàn phường & có bộ lọc theo tổ/người phụ trách
  const scopedIncidents = useMemo(() => {
    const valid = incidents.filter(
      (i) => i.status !== 'pending_review' && i.status !== 'rejected'
    );
    if (!isFieldStaff) return valid;

    const myDept = (currentUser.department || '').trim().toLowerCase();
    const myName = (currentUser.name || '').trim().toLowerCase();
    const matched = valid.filter((i) => {
      const unitMatch =
        myDept &&
        i.assignedTo?.unitName &&
        i.assignedTo.unitName.trim().toLowerCase() === myDept;
      const assigneeMatch =
        myName &&
        i.assignedTo?.assigneeName &&
        i.assignedTo.assigneeName.trim().toLowerCase() === myName;
      return Boolean(unitMatch || assigneeMatch);
    });
    // Nếu tài khoản tổ xử lý chưa gắn tên tổ khớp 100% trong demo, fallback hiển thị các hồ sơ đã phân công để không bị màn hình trống
    return matched.length > 0 ? matched : valid.filter((i) => Boolean(i.assignedTo));
  }, [incidents, isFieldStaff, currentUser.department, currentUser.name]);

  const unitOptions = useMemo(() => getAllKnownUnits(scopedIncidents), [scopedIncidents]);
  const assigneeOptions = useMemo(
    () => getAllKnownAssignees(scopedIncidents),
    [scopedIncidents]
  );

  const myTasksCount = useMemo(
    () =>
      scopedIncidents.filter(
        (i) => i.assignedTo?.assigneeName?.trim() === currentUser.name
      ).length,
    [scopedIncidents, currentUser.name]
  );

  const matchesScope = (i: (typeof scopedIncidents)[number]) => {
    if (!isFieldStaff) {
      if (unitFilter !== 'all' && i.assignedTo?.unitName !== unitFilter) return false;
      if (
        assigneeFilter === UNASSIGNED_STAFF_LABEL &&
        i.assignedTo?.assigneeName?.trim()
      )
        return false;
      if (
        assigneeFilter !== 'all' &&
        assigneeFilter !== UNASSIGNED_STAFF_LABEL &&
        i.assignedTo?.assigneeName?.trim() !== assigneeFilter
      )
        return false;
    }
    if (
      mineOnly &&
      myTasksCount > 0 &&
      i.assignedTo?.assigneeName?.trim() !== currentUser.name
    )
      return false;
    return true;
  };

  const groups = {
    assigned: scopedIncidents.filter(
      (i) =>
        (i.status === 'assigned' || i.status === 'in_progress') && matchesScope(i)
    ),
    completed: scopedIncidents.filter((i) => isComplete(i) && matchesScope(i)),
  };

  const overdueActiveCount = groups.assigned.filter((i) => isOverdue(i)).length;
  const target = incidents.find((i) => i.id === resolveId);

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

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshIncidents();
    setRefreshing(false);
  };

  const sortedItems = [...groups[tab]].sort(
    (a, b) =>
      Number(b.id === linkedId) - Number(a.id === linkedId) ||
      Number(isOverdue(b)) - Number(isOverdue(a)) ||
      Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );

  return (
    <div className="space-y-5">
      {/* 1. HEADER & NÚT NHANH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Nhiệm Vụ Hiện Trường
            </h1>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-[5px] uppercase tracking-wider border border-blue-200">
              {isFieldStaff ? currentUser.department || 'Tổ xử lý' : 'Toàn phường'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Nhận việc, tick hoàn thành quy trình SOP, chụp ảnh nghiệm thu Trước – Sau tại hiện trường
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleManualRefresh()}
            disabled={refreshing}
            className="px-3 py-2 rounded-[5px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to="/admin/map"
            className="px-3.5 py-2 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Bản đồ hiện trường</span>
          </Link>
          {!isFieldStaff && (
            <Link
              to="/admin/inbox"
              className="px-3.5 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
            >
              <span>Tiếp nhận & phân công</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 2. 3 THẺ KPI NHANH */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-[5px] border border-slate-200 border-l-4 border-l-blue-600 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Đang cần xử lý</div>
            <div className="text-2xl font-black text-blue-900 mt-0.5">{groups.assigned.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Hồ sơ đã giao & đang thực hiện</div>
          </div>
          <div className="w-11 h-11 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 border-l-4 border-l-rose-600 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Quá hạn SLA</div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{overdueActiveCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cần ưu tiên hoàn thành ngay</div>
          </div>
          <div className="w-11 h-11 rounded-[5px] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 border-l-4 border-l-emerald-600 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Đã hoàn thành</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{groups.completed.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Có ảnh nghiệm thu Before – After</div>
          </div>
          <div className="w-11 h-11 rounded-[5px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. THANH TAB & BỘ LỌC */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 2 Tab gọn gàng: Cần xử lý & Đã xử lý */}
          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-200">
            <button
              type="button"
              onClick={() => setTab('assigned')}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition whitespace-nowrap ${
                tab === 'assigned'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cần xử lý ({groups.assigned.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('completed')}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-bold transition whitespace-nowrap ${
                tab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã xử lý ({groups.completed.length})
            </button>
          </div>

          {/* Bộ lọc theo Tổ / Người phụ trách */}
          <div className="flex flex-wrap items-center gap-2">
            {!isFieldStaff && (
              <>
                <select
                  aria-label="Lọc nhiệm vụ theo tổ xử lý"
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="h-9 px-3 rounded-[5px] border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">Tất cả tổ xử lý</option>
                  {unitOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Lọc nhiệm vụ theo người phụ trách"
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="h-9 px-3 rounded-[5px] border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">Tất cả người phụ trách</option>
                  <option value={UNASSIGNED_STAFF_LABEL}>{UNASSIGNED_STAFF_LABEL}</option>
                  {assigneeOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {myTasksCount > 0 && (
              <button
                type="button"
                onClick={() => setMineOnly((v) => !v)}
                className={`h-9 px-3.5 rounded-[5px] text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                  mineOnly
                    ? 'bg-violet-700 text-white border-violet-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Việc của tôi ({myTasksCount})</span>
              </button>
            )}
          </div>
        </div>
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

      {/* 4. DANH SÁCH THẺ NHIỆM VỤ */}
      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-10 text-center space-y-2 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">
            Không có nhiệm vụ nào trong mục này
          </div>
          <p className="text-xs text-slate-500">
            Khi Cán bộ điều phối giao việc mới, hồ sơ sẽ tự động hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedItems.map((item) => {
            const isHighlighted = item.id === linkedId;
            const overdue = isOverdue(item);
            const completed = isComplete(item);
            const steps = item.workflowSteps || [];
            const doneSteps = steps.filter((s) => s.completed).length;
            const progressPct = steps.length > 0 ? Math.round((doneSteps / steps.length) * 100) : 0;
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.location.lat},${item.location.lng}`;

            return (
              <article
                key={item.id}
                ref={isHighlighted ? highlightedCardRef : undefined}
                className={`bg-white rounded-[5px] border shadow-sm overflow-hidden flex flex-col justify-between transition ${
                  isHighlighted
                    ? 'border-blue-600 ring-2 ring-blue-500/30'
                    : overdue && !completed
                    ? 'border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Dòng đầu: Mã + Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-800 border border-slate-200">
                        {item.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-800 border border-blue-200">
                        {CATEGORIES[item.category]}
                      </span>
                      {item.verifiedByVolunteer && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Đã xác minh
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-[4px] border ${
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

                  {/* Tiêu đề + Ảnh hiện trường / Thanh trượt Trước - Sau */}
                  {completed && item.photosBefore.length > 0 && item.photosAfter && item.photosAfter.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <BeforeAfterSlider
                        photosBefore={item.photosBefore}
                        photosAfter={item.photosAfter}
                        beforeTimestamp={item.createdAt}
                        afterTimestamp={item.resolution?.resolvedAt || item.updatedAt}
                        address={item.location.address}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {item.photosBefore[0] && (
                        <img
                          src={item.photosBefore[0]}
                          alt={item.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-[5px] object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                        <div className="flex items-start gap-1 text-[11px] text-slate-500 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.location.address}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thông tin phân công + Hạn SLA */}
                  {item.assignedTo && (
                    <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          {item.assignedTo.unitName}
                        </span>
                        <span
                          className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                            overdue && !completed ? 'text-rose-700' : 'text-slate-600'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {deadlineLabel(item)} ({formatDate(item.assignedTo.deadline)})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Phụ trách: <strong className="text-slate-900">{getAssigneeLabel(item.assignedTo)}</strong>
                      </div>
                      {item.assignedTo.notes && (
                        <p className="text-[11px] text-slate-600 italic pt-0.5">
                          “{item.assignedTo.notes}”
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quy trình SOP hiện trường (có thanh tiến độ & tick trực tiếp khi đang xử lý) */}
                  {steps.length > 0 && (
                    <div className="p-3 rounded-[5px] bg-blue-50/50 border border-blue-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Quy trình xử lý hiện trường (SOP)</span>
                        <span className="text-[11px] font-extrabold text-blue-700">
                          {doneSteps}/{steps.length} bước ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {steps.map((step, idx) => {
                          const canToggle = item.status === 'in_progress';
                          return (
                            <label
                              key={step.id}
                              className={`flex items-start gap-2 text-xs p-1.5 rounded-[4px] transition ${
                                canToggle
                                  ? 'cursor-pointer hover:bg-white'
                                  : 'opacity-80 cursor-default'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={step.completed}
                                disabled={!canToggle}
                                onChange={() =>
                                  toggleWorkflowStep(item.id, step.id, currentUser.name)
                                }
                                className="mt-0.5 accent-emerald-600 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span
                                  className={
                                    step.completed
                                      ? 'line-through text-slate-500'
                                      : 'text-slate-800 font-medium'
                                  }
                                >
                                  Bước {idx + 1}: {step.title}
                                </span>
                                {step.completedAt && (
                                  <span className="block text-[10px] text-emerald-700">
                                    ✓ {step.completedBy || currentUser.name} • {formatDate(step.completedAt)}
                                  </span>
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
                    <div className="p-3 rounded-[5px] bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                      <div className="font-bold text-emerald-900">
                        Kết quả nghiệm thu ({formatDate(item.resolution.resolvedAt)})
                      </div>
                      <p className="text-emerald-800">{item.resolution.notes}</p>
                    </div>
                  )}

                  {/* Form Xác minh tại chỗ (mở inline khi bấm Xác minh) */}
                  {verifyId === item.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(() => {
                          verifyIncident(item.id, notes.trim() || 'Đã xác minh đúng hiện trường.');
                          setVerifyId(null);
                          setNotes('');
                        }, `Đã ghi nhận xác minh hiện trường cho hồ sơ ${item.code}.`);
                      }}
                      className="p-3 rounded-[5px] bg-amber-50 border border-amber-300 space-y-2"
                    >
                      <label className="block text-xs font-bold text-amber-950">
                        Ghi chú xác minh tại hiện trường:
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ví dụ: Đã có mặt kiểm tra, xác nhận đúng vị trí sự cố..."
                        className="w-full px-3 py-2 rounded-[5px] border border-amber-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyId(null);
                            setNotes('');
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

                {/* Footer nút thao tác */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-[5px] bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chỉ đường</span>
                  </a>

                  <div className="flex flex-wrap items-center gap-2">
                    {!completed && !item.verifiedByVolunteer && verifyId !== item.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyId(item.id);
                          setNotes('');
                        }}
                        className="px-3 py-1.5 rounded-[5px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition"
                      >
                        Xác minh tại chỗ
                      </button>
                    )}

                    {item.status === 'assigned' && (
                      <button
                        type="button"
                        onClick={() =>
                          act(
                            () => startIncident(item.id),
                            `Đã chuyển hồ sơ ${item.code} sang Đang xử lý hiện trường.`
                          )
                        }
                        className="px-3.5 py-1.5 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Bắt đầu xử lý</span>
                      </button>
                    )}

                    {item.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => setResolveId(item.id)}
                        className="px-3.5 py-1.5 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Hoàn thành & Ảnh sau</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Nghiệm thu Before - After */}
      {target && (
        <IncidentResolutionModal
          incident={target}
          onClose={() => setResolveId(null)}
        />
      )}
    </div>
  );
}

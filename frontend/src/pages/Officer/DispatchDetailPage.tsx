import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useTeamStore } from '../../store/useTeamStore';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  CATEGORIES,
  DEFAULT_WORKFLOW_TEMPLATES,
  STATUS_LABELS,
  formatDate,
} from '../../lib/incidents';
import type { IncidentPriority, WorkflowStep } from '../../types/incident';
import {
  ArrowLeft,
  MapPin,
  User,
  Users,
  Phone,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Building2,
  Clock,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  AlertCircle,
  ListChecks,
  Plus,
  X,
  RotateCcw,
} from 'lucide-react';

export const DispatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, assignIncident } = useIncidentStore();
  const { currentUser } = useAuthStore();
  const { units, members } = useTeamStore();

  const incident = incidents.find((item) => item.id === id);

  // Chế độ phân công: 'individual' (Cá nhân) hoặc 'group' (Tổ đội / Nhóm)
  const [assignMode, setAssignMode] = useState<'individual' | 'group'>('individual');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [priority, setPriority] = useState<IncidentPriority>(incident?.priority || 'high');
  const [deadlineDays, setDeadlineDays] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [workflowDraft, setWorkflowDraft] = useState<string[]>(() =>
    incident
      ? [...(DEFAULT_WORKFLOW_TEMPLATES[incident.category] || DEFAULT_WORKFLOW_TEMPLATES.other)]
      : [...DEFAULT_WORKFLOW_TEMPLATES.other]
  );
  const [newStepText, setNewStepText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Danh sách toàn bộ nhân sự kèm đơn vị & số việc đang xử lý (đồng bộ từ useTeamStore)
  const staffCandidates = useMemo(() => {
    const distances = ['450m (~5p)', '1.2km (~8p)', '1.8km (~12p)', '2.1km (~15p)', '2.6km (~18p)'];
    const unitMap = new Map(units.map((u) => [u.id, u]));

    const list = members
      .filter((m) => m.status !== 'off_duty')
      .map((member, idx) => {
        const unit = unitMap.get(member.unitId);
        const activeTasks = incidents.filter(
          (inc) =>
            (inc.status === 'assigned' || inc.status === 'in_progress') &&
            inc.assignedTo?.assigneeId === member.id
        ).length;
        const parts = member.name.split(' ');
        const initials =
          parts.length >= 2
            ? `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : member.name.slice(0, 2).toUpperCase();

        return {
          id: member.id,
          name: member.name,
          initials,
          role: member.role,
          unitName: unit?.name || 'UBND Phường Trấn Biên',
          category: unit?.category || 'other',
          activeTasks,
          distance: distances[idx % distances.length],
          phone: member.phone,
        };
      });

    // Ưu tiên đưa nhân sự cùng lĩnh vực & rảnh việc lên đầu
    if (incident) {
      list.sort((a, b) => {
        const aMatch = a.category === incident.category ? 1 : 0;
        const bMatch = b.category === incident.category ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return a.activeTasks - b.activeTasks;
      });
    }
    return list;
  }, [incidents, incident, units, members]);

  // Danh sách các Tổ đội (Nhóm) đồng bộ từ useTeamStore
  const groupCandidates = useMemo(() => {
    return units
      .map((unit) => {
        const staff = members.filter((m) => m.unitId === unit.id);
        const activeTasks = incidents.filter(
          (inc) =>
            (inc.status === 'assigned' || inc.status === 'in_progress') &&
            inc.assignedTo?.unitName === unit.name
        ).length;
        return {
          ...unit,
          staff,
          activeTasks,
          isRecommended: incident?.category === unit.category,
        };
      })
      .sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
  }, [incidents, incident, units, members]);

  // Tự chọn ứng viên tối ưu mặc định
  const effectiveStaffId = selectedStaffId || staffCandidates[0]?.id || '';
  const effectiveUnitName = selectedUnitName || groupCandidates[0]?.name || '';

  if (!incident) {
    return (
      <div className="bg-white rounded-[5px] border border-slate-200 p-10 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-black text-slate-900">Không tìm thấy hồ sơ phản ánh</h2>
        <button
          onClick={() => navigate('/inbox')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-[5px] text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại hàng đợi tiếp nhận
        </button>
      </div>
    );
  }

  const canAssign = incident.status === 'pending';

  const getCategoryIcon = () => {
    switch (incident.category) {
      case 'street_light':
        return <Lightbulb className="w-5 h-5 text-white" />;
      case 'flooding':
        return <Waves className="w-5 h-5 text-white" />;
      case 'waste':
        return <Trash2 className="w-5 h-5 text-white" />;
      case 'road_damage':
        return <Construction className="w-5 h-5 text-white" />;
      default:
        return <AlertCircle className="w-5 h-5 text-white" />;
    }
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const workflowSteps: WorkflowStep[] = workflowDraft
      .map((t) => t.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: `step-${Date.now().toString(36)}-${idx + 1}`,
        title,
        completed: false,
      }));

    try {
      if (assignMode === 'individual') {
        const staff = staffCandidates.find((s) => s.id === effectiveStaffId);
        if (!staff) {
          setErrorMsg('Vui lòng chọn một nhân sự phụ trách.');
          return;
        }
        assignIncident(incident.id, staff.unitName, deadlineDays, currentUser.name, {
          priority,
          assigneeId: staff.id,
          assigneeName: staff.name,
          notes: notes.trim() || undefined,
          expectedUpdatedAt: incident.updatedAt,
          workflowSteps,
        });
        setSuccessMsg(
          `Đã phân công thành công cho Đ/c ${staff.name} (${staff.unitName}) kèm ${workflowSteps.length} bước quy trình.`
        );
      } else {
        const unit = groupCandidates.find((u) => u.name === effectiveUnitName);
        if (!unit) {
          setErrorMsg('Vui lòng chọn một tổ đội tiếp ứng.');
          return;
        }
        assignIncident(incident.id, unit.name, deadlineDays, currentUser.name, {
          priority,
          notes: notes.trim() || undefined,
          expectedUpdatedAt: incident.updatedAt,
          workflowSteps,
        });
        setSuccessMsg(
          `Đã phân công theo nhóm cho ${unit.name} (${unit.staff.length} thành viên) kèm ${workflowSteps.length} bước quy trình.`
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể phân công hồ sơ lúc này.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. BREADCRUMB */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/inbox')}
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hàng đợi tiếp nhận</span>
          </button>
          <span>/</span>
          <span className="font-mono font-bold text-slate-900">Hồ sơ #{incident.code}</span>
        </div>
      </div>

      {/* 2. HEADER ĐỊA CHỈ & TRẠNG THÁI (ĐÚNG MẪU ẢNH 3) */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-[5px] border border-blue-200">
            #{incident.code}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-[5px] border inline-flex items-center gap-1.5 ${
              incident.status === 'pending'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : incident.status === 'resolved' || incident.status === 'closed'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-blue-100 text-blue-800 border-blue-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                incident.status === 'pending'
                  ? 'bg-amber-500'
                  : incident.status === 'resolved' || incident.status === 'closed'
                  ? 'bg-emerald-600'
                  : 'bg-blue-600'
              }`}
            />
            {incident.status === 'pending' ? 'Chờ phân công cán bộ' : STATUS_LABELS[incident.status]}
          </span>
          <span className="text-xs font-bold text-slate-500 ml-auto">
            Tiếp nhận: {formatDate(incident.createdAt)}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm sm:text-base font-extrabold text-slate-900">
          <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <span>{incident.location.address}</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-[5px] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3. BỐ CỤC 2 CỘT CHUẨN ẢNH 3: TRÁI (THÔNG TIN PHẢN ÁNH) | PHẢI (PHÂN CÔNG NHÂN LỰC) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): THÔNG TIN PHẢN ÁNH */}
        <div className="lg:col-span-7 bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
          {/* Lĩnh vực hạ tầng */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[5px] bg-blue-700 flex items-center justify-center shrink-0">
                {getCategoryIcon()}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Lĩnh vực hạ tầng
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                  {CATEGORIES[incident.category]} — {incident.title}
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả sự cố của người dân */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Mô tả sự cố của người dân
            </div>
            <div className="p-4 rounded-[5px] bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              "{incident.description}"
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Người báo: <strong className="text-slate-700">{incident.sender.name}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                SĐT: <strong className="text-slate-700 font-mono">{incident.sender.phone}</strong>
              </span>
            </div>
          </div>

          {/* Ảnh hiện trường */}
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Ảnh hiện trường ({String(incident.photosBefore.length).padStart(2, '0')} ảnh)
            </div>
            <div
              className={`grid gap-2.5 ${
                incident.photosBefore.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {incident.photosBefore.map((src, idx) => (
                <div
                  key={idx}
                  className="aspect-[16/10] rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200 relative"
                >
                  <img
                    src={src}
                    alt={`Hiện trường ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px]">
                    Hiện trường #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bản đồ vị trí sự cố */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Bản đồ vị trí hiện trường
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
              </span>
            </div>
            <div className="rounded-[5px] overflow-hidden border border-slate-200 h-[250px]">
              <OpenStreetMap
                key={incident.id}
                height="100%"
                className="h-full"
                mode="officer"
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

        {/* CỘT PHẢI (5/12): PHÂN CÔNG NHÂN LỰC (CHỈ CHO GIAO KHI CHƯA PHÂN CÔNG) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4 min-w-0">
          {canAssign ? (
            <form
              onSubmit={handleConfirmDispatch}
              className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4"
            >
              {/* Header + 2 Tab Cá nhân / Tổ đội (ĐÚNG MẪU ẢNH 3) */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Nhân sự / Đội tiếp ứng
                </h2>
                <div className="inline-flex bg-slate-100 p-0.5 rounded-[5px] border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAssignMode('individual')}
                    className={`px-2.5 py-1 rounded-[4px] text-xs font-bold inline-flex items-center gap-1 transition ${
                      assignMode === 'individual'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Cá nhân</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode('group')}
                    className={`px-2.5 py-1 rounded-[4px] text-xs font-bold inline-flex items-center gap-1 transition ${
                      assignMode === 'group'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Tổ đội</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 px-3 py-2 rounded-[5px] text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Danh sách chọn CÁ NHÂN hoặc TỔ ĐỘI (NHÓM) */}
              {assignMode === 'individual' ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {staffCandidates.map((staff, idx) => {
                    const isChecked = effectiveStaffId === staff.id;
                    const isOptimal = idx === 0;
                    return (
                      <label
                        key={staff.id}
                        onClick={() => setSelectedStaffId(staff.id)}
                        className={`flex items-start gap-3 p-3 rounded-[5px] border cursor-pointer transition ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="staff"
                          checked={isChecked}
                          onChange={() => setSelectedStaffId(staff.id)}
                          className="mt-1 accent-blue-700 shrink-0"
                        />
                        <div
                          className={`w-9 h-9 rounded-[5px] flex items-center justify-center font-black text-xs shrink-0 ${
                            isChecked ? 'bg-blue-700 text-white' : 'bg-slate-800 text-white'
                          }`}
                        >
                          {staff.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                Đ/c {staff.name}
                              </span>
                              {isOptimal && (
                                <span className="bg-blue-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] shrink-0">
                                  Tối ưu
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] shrink-0 ${
                                staff.activeTasks === 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {staff.activeTasks === 0 ? 'Rảnh (0 việc)' : `${staff.activeTasks} việc`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {staff.unitName} • {staff.role}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="text-blue-700 font-semibold">📍 {staff.distance}</span>
                            <span className="font-mono">{staff.phone}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {groupCandidates.map((unit) => {
                    const isChecked = effectiveUnitName === unit.name;
                    return (
                      <label
                        key={unit.id}
                        onClick={() => setSelectedUnitName(unit.name)}
                        className={`flex items-start gap-3 p-3 rounded-[5px] border cursor-pointer transition ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="unit-group"
                          checked={isChecked}
                          onChange={() => setSelectedUnitName(unit.name)}
                          className="mt-1 accent-blue-700 shrink-0"
                        />
                        <div
                          className={`w-9 h-9 rounded-[5px] flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-blue-700 text-white' : 'bg-slate-800 text-white'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {unit.name}
                              </span>
                              {unit.isRecommended && (
                                <span className="bg-blue-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] shrink-0">
                                  Đúng chuyên môn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                              {unit.staff.length} nhân sự
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            Thành viên: {unit.staff.map((s) => s.name).join(', ')}
                          </div>
                          <div className="text-[11px] text-blue-700 font-semibold mt-1">
                            Đang phụ trách: {unit.activeTasks} hồ sơ mở
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Mức độ ưu tiên & Hạn xử lý */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mức độ ưu tiên:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-[5px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="normal">Bình thường</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hạn xử lý (SLA):
                  </label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-[5px] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value={1}>Trong 24 giờ (1 ngày)</option>
                    <option value={2}>Tiêu chuẩn (2 ngày)</option>
                    <option value={3}>3 ngày làm việc</option>
                    <option value={5}>5 ngày làm việc</option>
                  </select>
                </div>
              </div>

              {/* Quy trình xử lý riêng cho hiện trường này */}
              <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Quy trình xử lý hiện trường ({workflowDraft.length} bước)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkflowDraft([
                        ...(DEFAULT_WORKFLOW_TEMPLATES[incident.category] ||
                          DEFAULT_WORKFLOW_TEMPLATES.other),
                      ])
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                    title="Khôi phục mẫu quy trình chuẩn theo loại sự cố"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Mẫu chuẩn</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {workflowDraft.map((stepText, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-[4px] bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={stepText}
                        onChange={(e) => {
                          const next = [...workflowDraft];
                          next[idx] = e.target.value;
                          setWorkflowDraft(next);
                        }}
                        className="flex-1 h-8 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setWorkflowDraft((prev) => prev.filter((_, i) => i !== idx))
                        }
                        title="Xóa bước này"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newStepText.trim()) {
                          setWorkflowDraft((prev) => [...prev, newStepText.trim()]);
                          setNewStepText('');
                        }
                      }
                    }}
                    placeholder="Nhập thêm bước xử lý riêng..."
                    className="flex-1 h-8 px-2.5 rounded-[5px] border border-dashed border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newStepText.trim()) {
                        setWorkflowDraft((prev) => [...prev, newStepText.trim()]);
                        setNewStepText('');
                      }
                    }}
                    className="h-8 px-2.5 rounded-[5px] bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 text-xs font-semibold inline-flex items-center gap-1 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm bước</span>
                  </button>
                </div>
              </div>

              {/* Ghi chú cho nhân sự */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Ghi chú cho nhân sự / phân công
                  </label>
                  <span className="text-[11px] text-slate-400">Không bắt buộc</span>
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Ưu tiên cắm biển cảnh báo và xử lý dứt điểm trước 16h30..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-[5px] text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Log điều phối */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Log điều phối được ghi nhận minh bạch trên hệ thống</span>
              </div>

              {/* Nút Quay lại & Xác nhận phân công */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/inbox')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-[5px] text-xs font-bold transition inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs sm:text-sm font-black shadow-sm transition inline-flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Xác nhận phân công</span>
                </button>
              </div>
            </form>
          ) : (
            /* HỒ SƠ ĐÃ PHÂN CÔNG / ĐÃ XỬ LÝ: CHỈ HIỂN THỊ THÔNG TIN, KHÔNG CHO GIAO MỚI */
            <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-emerald-600 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Thông tin phân công & xử lý
                </h2>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-[5px] border border-emerald-200">
                  {STATUS_LABELS[incident.status]}
                </span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="p-3 rounded-[5px] bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-blue-800 uppercase">Đơn vị tiếp nhận</div>
                    <div className="font-extrabold text-blue-950 mt-0.5">
                      {incident.assignedTo?.unitName || 'UBND Phường Trấn Biên'}
                    </div>
                    {incident.assignedTo?.assigneeName && (
                      <div className="text-xs text-blue-800 mt-0.5">
                        Cán bộ phụ trách: <strong>Đ/c {incident.assignedTo.assigneeName}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {incident.assignedTo && (
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ngày giao</span>
                      <strong className="text-slate-800">{formatDate(incident.assignedTo.assignedAt)}</strong>
                    </div>
                    <div className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Hạn SLA</span>
                      <strong className="text-slate-800">{formatDate(incident.assignedTo.deadline)}</strong>
                    </div>
                  </div>
                )}

                {incident.assignedTo?.notes && (
                  <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Chỉ đạo / Ghi chú:</span>
                    <p className="text-slate-600">{incident.assignedTo.notes}</p>
                  </div>
                )}

                {incident.workflowSteps && incident.workflowSteps.length > 0 && (
                  <div className="p-3 rounded-[5px] bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-blue-700" />
                        Quy trình xử lý hiện trường
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {incident.workflowSteps.filter((s) => s.completed).length}/
                        {incident.workflowSteps.length} bước
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {incident.workflowSteps.map((step, idx) => (
                        <li key={step.id} className="flex items-start gap-2">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
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
                                  ? 'text-slate-500 line-through'
                                  : 'text-slate-800 font-medium'
                              }
                            >
                              {step.title}
                            </span>
                            {step.completedAt && (
                              <span className="block text-[10px] text-emerald-700">
                                Hoàn thành lúc {formatDate(step.completedAt)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {incident.resolution && (
                  <div className="p-3.5 rounded-[5px] bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                    <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Kết quả nghiệm thu hoàn thành</span>
                    </div>
                    <p className="text-emerald-800">{incident.resolution.notes}</p>
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hoàn thành lúc: {formatDate(incident.resolution.resolvedAt)}</span>
                    </div>
                  </div>
                )}

                {incident.photosAfter && incident.photosAfter.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase block">
                      Ảnh sau khi xử lý:
                    </span>
                    <div className="aspect-video rounded-[5px] overflow-hidden border border-slate-200">
                      <img
                        src={incident.photosAfter[0]}
                        alt="Sau xử lý"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/inbox')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[5px] text-xs font-bold transition inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách tiếp nhận</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

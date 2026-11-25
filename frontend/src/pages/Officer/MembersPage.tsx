import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCog,
  Search,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Briefcase,
  Shield,
} from 'lucide-react';
import { useTeamStore, type StaffMember, type TeamUnit } from '../../store/useTeamStore';
import { useIncidentStore } from '../../store/useIncidentStore';
import { CATEGORIES } from '../../lib/incidents';
import type { IncidentCategory } from '../../types/incident';

export const MembersPage: React.FC = () => {
  const { units, members, updateMember, removeMember, addUnit, updateUnit, removeUnit } =
    useTeamStore();
  const { incidents } = useIncidentStore();

  const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnitId, setFilterUnitId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'off_duty'>('all');

  // Modal Thành viên
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [mName, setMName] = useState('');
  const [mRole, setMRole] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mUnitId, setMUnitId] = useState(units[0]?.id || '');
  const [mStatus, setMStatus] = useState<'available' | 'busy' | 'off_duty'>('available');

  // Modal Nhóm / Tổ đội (2 cột: thông tin nhóm bên trái + chọn thành viên bên phải)
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<TeamUnit | null>(null);
  const [uName, setUName] = useState('');
  const [uCategory, setUCategory] = useState<IncidentCategory>('street_light');
  const [uHotline, setUHotline] = useState('');
  const [uDescription, setUDescription] = useState('');
  const [uSelectedMemberIds, setUSelectedMemberIds] = useState<string[]>([]);
  const [uMemberSearch, setUMemberSearch] = useState('');

  // Modal chọn thành viên từ danh sách hiện có để phân vào Nhóm / Tổ đội
  const [assignUnitTarget, setAssignUnitTarget] = useState<TeamUnit | null>(null);
  const [assignSearch, setAssignSearch] = useState('');

  // Tính khối lượng hồ sơ thực tế của từng thành viên & tổ đội
  const memberWorkload = useMemo(() => {
    const map = new Map<string, { active: number; completed: number }>();
    members.forEach((m) => {
      let active = 0;
      let completed = 0;
      incidents.forEach((inc) => {
        if (inc.assignedTo?.assigneeId === m.id || inc.assignedTo?.assigneeName === m.name) {
          if (inc.status === 'resolved' || inc.status === 'closed') completed++;
          else if (inc.status === 'assigned' || inc.status === 'in_progress') active++;
        }
      });
      map.set(m.id, { active, completed });
    });
    return map;
  }, [members, incidents]);

  const unitWorkload = useMemo(() => {
    const map = new Map<string, { active: number; completed: number }>();
    units.forEach((u) => {
      let active = 0;
      let completed = 0;
      incidents.forEach((inc) => {
        if (inc.assignedTo?.unitName === u.name) {
          if (inc.status === 'resolved' || inc.status === 'closed') completed++;
          else if (inc.status === 'assigned' || inc.status === 'in_progress') active++;
        }
      });
      map.set(u.id, { active, completed });
    });
    return map;
  }, [units, incidents]);

  const unitById = useMemo(() => {
    const map = new Map<string, TeamUnit>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Lọc thành viên
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const unit = unitById.get(m.unitId);
      const load = memberWorkload.get(m.id)?.active || 0;
      const effectiveStatus = m.status === 'off_duty' ? 'off_duty' : load > 0 ? 'busy' : m.status;

      if (filterUnitId !== 'all' && m.unitId !== filterUnitId) return false;
      if (filterStatus !== 'all' && effectiveStatus !== filterStatus) return false;
      if (q) {
        const match =
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          (unit?.name.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      return true;
    });
  }, [members, unitById, memberWorkload, filterUnitId, filterStatus, searchQuery]);

  // Lọc nhóm / tổ đội
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return units;
    return units.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q) ||
        CATEGORIES[u.category].toLowerCase().includes(q)
    );
  }, [units, searchQuery]);

  // KPI tổng quan
  const kpi = useMemo(() => {
    let available = 0;
    let busy = 0;
    members.forEach((m) => {
      const active = memberWorkload.get(m.id)?.active || 0;
      if (m.status === 'off_duty') return;
      if (active > 0 || m.status === 'busy') busy++;
      else available++;
    });
    return {
      totalMembers: members.length,
      totalUnits: units.length,
      available,
      busy,
    };
  }, [members, units, memberWorkload]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Mở modal chỉnh sửa Thành viên (thành viên mới được đồng bộ tự động từ trang Tài khoản Admin & Tổ xử lý)
  const openEditMember = (member: StaffMember) => {
    setEditingMember(member);
    setMName(member.name);
    setMRole(member.role);
    setMPhone(member.phone);
    setMUnitId(member.unitId);
    setMStatus(member.status);
    setMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !mName.trim() || !mUnitId) return;
    updateMember(editingMember.id, {
      name: mName.trim(),
      role: mRole.trim() || 'Tổ viên hiện trường',
      phone: mPhone.trim() || 'Chưa cập nhật',
      unitId: mUnitId,
      status: mStatus,
    });
    setMemberModalOpen(false);
  };

  // Mở modal Tổ đội (2 cột kèm chọn thành viên bên phải)
  const openAddUnit = () => {
    setEditingUnit(null);
    setUName('');
    setUCategory('street_light');
    setUHotline('');
    setUDescription('');
    setUSelectedMemberIds([]);
    setUMemberSearch('');
    setUnitModalOpen(true);
  };

  const openEditUnit = (unit: TeamUnit) => {
    setEditingUnit(unit);
    setUName(unit.name);
    setUCategory(unit.category);
    setUHotline(unit.hotline);
    setUDescription(unit.description);
    setUSelectedMemberIds(members.filter((m) => m.unitId === unit.id).map((m) => m.id));
    setUMemberSearch('');
    setUnitModalOpen(true);
  };

  const toggleUnitMemberSelection = (memberId: string) => {
    setUSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName.trim()) return;
    const payload = {
      name: uName.trim(),
      category: uCategory,
      hotline: uHotline.trim() || '0251.382.1100',
      description: uDescription.trim() || 'Tổ đội tiếp ứng xử lý sự cố hạ tầng đô thị.',
    };
    if (editingUnit) {
      updateUnit(editingUnit.id, payload);
      uSelectedMemberIds.forEach((mId) => {
        const m = members.find((x) => x.id === mId);
        if (m && m.unitId !== editingUnit.id) {
          updateMember(mId, { unitId: editingUnit.id });
        }
      });
    } else {
      addUnit(payload, uSelectedMemberIds);
    }
    setUnitModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Quản lý Thành viên & Tổ đội
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Danh sách cán bộ hiện trường và các nhóm chuyên môn phục vụ điều phối xử lý sự cố Phường Trấn Biên
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openAddUnit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Thêm nhóm</span>
          </button>
          <Link
            to="/admin/accounts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white shadow-sm transition"
          >
            <UserCog className="w-4 h-4" />
            <span>Quản lý tài khoản nhân sự →</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI TỔNG QUAN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng thành viên</div>
            <div className="text-xl font-bold text-slate-800">{kpi.totalMembers}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Nhóm / Tổ đội</div>
            <div className="text-xl font-bold text-slate-800">{kpi.totalUnits}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang sẵn sàng</div>
            <div className="text-xl font-bold text-emerald-700">{kpi.available}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đang xử lý việc</div>
            <div className="text-xl font-bold text-amber-700">{kpi.busy}</div>
          </div>
        </div>
      </div>

      {/* 3. THANH CHUYỂN TAB + BỘ LỌC */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 2 Tab chính: Thành viên | Nhóm & Tổ đội */}
          <div className="inline-flex bg-slate-100 p-1 rounded-[5px] border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-4 py-1.5 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === 'members'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Thành viên ({members.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-1.5 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                activeTab === 'groups'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Nhóm / Tổ đội ({units.length})</span>
            </button>
          </div>

          {/* Tìm kiếm & Lọc */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'members'
                    ? 'Tìm tên, chức vụ, SĐT...'
                    : 'Tìm tên tổ đội, lĩnh vực...'
                }
                className="w-full h-9 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {activeTab === 'members' && (
              <>
                <select
                  value={filterUnitId}
                  onChange={(e) => setFilterUnitId(e.target.value)}
                  className="h-9 px-3 rounded-[5px] border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">Tất cả tổ đội</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as 'all' | 'available' | 'busy' | 'off_duty')
                  }
                  className="h-9 px-3 rounded-[5px] border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="all">Mọi trạng thái</option>
                  <option value="available">Sẵn sàng</option>
                  <option value="busy">Đang xử lý việc</option>
                  <option value="off_duty">Tạm nghỉ</option>
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. NỘI DUNG TAB THÀNH VIÊN */}
      {activeTab === 'members' ? (
        <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-9 h-9 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">
                Không tìm thấy thành viên nào phù hợp
              </div>
              <p className="text-xs text-slate-500">
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc tổ đội.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Thành viên</th>
                    <th className="py-3 px-4">Nhóm / Tổ đội</th>
                    <th className="py-3 px-4">Liên hệ</th>
                    <th className="py-3 px-4">Khối lượng</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredMembers.map((member) => {
                    const unit = unitById.get(member.unitId);
                    const load = memberWorkload.get(member.id) || { active: 0, completed: 0 };
                    const effectiveStatus =
                      member.status === 'off_duty'
                        ? 'off_duty'
                        : load.active > 0
                          ? 'busy'
                          : member.status;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[5px] bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(member.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{member.role}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700">
                            {unit?.name || 'Chưa phân tổ'}
                          </div>
                          {unit && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-slate-100 text-slate-600">
                              {CATEGORIES[unit.category]}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {member.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs font-semibold text-slate-700">
                            {load.active} đang xử lý
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {load.completed} đã hoàn tất
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {effectiveStatus === 'available' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Sẵn sàng
                            </span>
                          ) : effectiveStatus === 'busy' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Đang xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Tạm nghỉ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditMember(member)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-[5px] text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa thành viên "${member.name}" khỏi danh sách?`)) {
                                  removeMember(member.id);
                                }
                              }}
                              title="Xóa"
                              className="p-1.5 rounded-[5px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* 5. NỘI DUNG TAB NHÓM / TỔ ĐỘI */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const unitMembers = members.filter((m) => m.unitId === unit.id);
            const load = unitWorkload.get(unit.id) || { active: 0, completed: 0 };
            return (
              <div
                key={unit.id}
                className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 flex flex-col justify-between gap-4 hover:border-blue-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[5px] bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{unit.name}</h3>
                        <span className="inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700">
                          {CATEGORIES[unit.category]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditUnit(unit)}
                        title="Sửa tổ đội"
                        className="p-1.5 rounded-[5px] text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              `Xóa nhóm "${unit.name}" và ${unitMembers.length} thành viên thuộc nhóm này?`
                            )
                          ) {
                            removeUnit(unit.id);
                          }
                        }}
                        title="Xóa tổ đội"
                        className="p-1.5 rounded-[5px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">{unit.description}</p>

                  <div className="flex items-center justify-between text-xs bg-slate-50 rounded-[5px] px-3 py-2 border border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {unit.hotline}
                    </span>
                    <div className="flex items-center gap-2.5 text-[11px] font-semibold">
                      <span className="text-blue-700">{load.active} đang xử lý</span>
                      <span className="text-emerald-700">{load.completed} xong</span>
                    </div>
                  </div>

                  {/* Danh sách thành viên trong tổ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
                      <span>Thành viên ({unitMembers.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignSearch('');
                          setAssignUnitTarget(unit);
                        }}
                        className="text-blue-700 hover:underline normal-case font-semibold inline-flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Chọn từ DS thành viên
                      </button>
                    </div>
                    {unitMembers.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-1">
                        Chưa có thành viên nào trong tổ này.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {unitMembers.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[5px] bg-white border border-slate-200/80 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-[4px] bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {getInitials(m.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">
                                  {m.name}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">{m.role}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-mono text-slate-500">
                                {m.phone}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateMember(m.id, { unitId: '' })}
                                title="Gỡ khỏi nhóm này"
                                className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CHỌN THÀNH VIÊN HIỆN CÓ ĐỂ PHÂN VÀO NHÓM */}
      {assignUnitTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Phân công thành viên vào {assignUnitTarget.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn từ danh sách thành viên hiện có trong hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignUnitTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Tìm nhanh theo tên hoặc SĐT thành viên..."
                  className="w-full h-9 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-[5px]">
                {members
                  .filter((m) => {
                    const q = assignSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.phone.toLowerCase().includes(q) ||
                      m.role.toLowerCase().includes(q)
                    );
                  })
                  .map((m) => {
                    const inThisUnit = m.unitId === assignUnitTarget.id;
                    const currentUnitName = m.unitId ? unitById.get(m.unitId)?.name : '';
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs ${
                          inThisUnit ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-[5px] bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {getInitials(m.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{m.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {m.phone} •{' '}
                              {inThisUnit
                                ? 'Đang thuộc nhóm này'
                                : currentUnitName
                                  ? `Đang ở: ${currentUnitName}`
                                  : 'Chưa phân tổ'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateMember(m.id, {
                              unitId: inThisUnit ? '' : assignUnitTarget.id,
                            })
                          }
                          className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold border transition shrink-0 ${
                            inThisUnit
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                          }`}
                        >
                          {inThisUnit ? 'Gỡ ra' : 'Thêm vào nhóm'}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAssignUnitTarget(null)}
                  className="px-4 py-2 rounded-[5px] bg-slate-800 hover:bg-slate-900 text-xs font-semibold text-white"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA THÀNH VIÊN */}
      {memberModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
              </h3>
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMember} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chức vụ / Vai trò
                  </label>
                  <input
                    type="text"
                    value={mRole}
                    onChange={(e) => setMRole(e.target.value)}
                    placeholder="VD: Kỹ thuật viên"
                    className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="09xx.xxx.xxx"
                    className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thuộc nhóm / Tổ đội *
                  </label>
                  <select
                    value={mUnitId}
                    onChange={(e) => setMUnitId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái trực
                  </label>
                  <select
                    value={mStatus}
                    onChange={(e) =>
                      setMStatus(e.target.value as 'available' | 'busy' | 'off_duty')
                    }
                    className="w-full h-9 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="busy">Đang bận</option>
                    <option value="off_duty">Tạm nghỉ</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-[5px] border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white"
                >
                  {editingMember ? 'Lưu thay đổi' : 'Thêm thành viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA NHÓM / TỔ ĐỘI (2 CỘT: THÔNG TIN BÊN TRÁI + CHỌN THÀNH VIÊN BÊN PHẢI) */}
      {unitModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingUnit ? 'Chỉnh sửa nhóm / tổ đội' : 'Tạo nhóm / tổ đội mới'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Điền thông tin nhóm bên trái và tick chọn thành viên thêm vào nhóm ngay bên phải
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUnitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Cột trái (6/12): Thông tin nhóm */}
                <div className="md:col-span-6 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên nhóm / tổ đội *
                    </label>
                    <input
                      type="text"
                      required
                      value={uName}
                      onChange={(e) => setUName(e.target.value)}
                      placeholder="VD: Tổ phản ứng nhanh Khu phố 2"
                      className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lĩnh vực phụ trách
                      </label>
                      <select
                        value={uCategory}
                        onChange={(e) => setUCategory(e.target.value as IncidentCategory)}
                        className="w-full h-9 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {Object.entries(CATEGORIES).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Đường dây nóng
                      </label>
                      <input
                        type="text"
                        value={uHotline}
                        onChange={(e) => setUHotline(e.target.value)}
                        placeholder="0251.382.xxxx"
                        className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mô tả nhiệm vụ
                    </label>
                    <textarea
                      rows={4}
                      value={uDescription}
                      onChange={(e) => setUDescription(e.target.value)}
                      placeholder="Mô tả phạm vi chuyên môn của tổ đội..."
                      className="w-full px-3 py-2 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Cột phải (6/12): Danh sách thành viên để chọn add vào nhóm */}
                <div className="md:col-span-6 flex flex-col border border-slate-200 rounded-[5px] bg-slate-50/60 overflow-hidden">
                  <div className="p-3 border-b border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chọn thành viên vào nhóm</span>
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                        Đã chọn: {uSelectedMemberIds.length}
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={uMemberSearch}
                        onChange={(e) => setUMemberSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc SĐT..."
                        className="w-full h-8 pl-8 pr-2.5 rounded-[5px] border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex-1 max-h-64 overflow-y-auto divide-y divide-slate-200/70">
                    {members
                      .filter((m) => {
                        const q = uMemberSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          m.name.toLowerCase().includes(q) ||
                          m.phone.toLowerCase().includes(q) ||
                          m.role.toLowerCase().includes(q)
                        );
                      })
                      .map((m) => {
                        const checked = uSelectedMemberIds.includes(m.id);
                        const currentUnit = unitById.get(m.unitId);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition text-xs ${
                              checked ? 'bg-blue-50/80' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUnitMemberSelection(m.id)}
                              className="accent-blue-700 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 truncate">{m.name}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {m.phone} • {currentUnit ? currentUnit.name : 'Chưa gán tổ'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    {members.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Chưa có tài khoản nhân sự nào. Hãy tạo tài khoản ở mục Tài khoản.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnitModalOpen(false)}
                  className="px-4 py-2 rounded-[5px] border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white shadow-sm"
                >
                  {editingUnit
                    ? 'Lưu thay đổi'
                    : uSelectedMemberIds.length > 0
                    ? `Tạo nhóm (${uSelectedMemberIds.length} thành viên)`
                    : 'Tạo nhóm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

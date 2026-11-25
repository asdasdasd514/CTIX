import React, { useEffect, useMemo, useState } from 'react';
import {
  UserCog,
  UserPlus,
  Search,
  Phone,
  ShieldCheck,
  Users,
  Wrench,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { usersApi, type AccountRecord } from '../../services/api';
import { useTeamStore } from '../../store/useTeamStore';

type RoleOption = 'citizen' | 'officer' | 'leader' | 'volunteer';

const ROLE_META: Record<
  RoleOption,
  { label: string; badgeClass: string; isStaff: boolean }
> = {
  officer: {
    label: 'Quản trị viên (Admin)',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    isStaff: true,
  },
  leader: {
    label: 'Cán bộ Điều hành',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    isStaff: true,
  },
  volunteer: {
    label: 'Đội xử lý hiện trường',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    isStaff: true,
  },
  citizen: {
    label: 'Công dân',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    isStaff: false,
  },
};

export const AccountsPage: React.FC = () => {
  const { units, syncTeamsFromBackend } = useTeamStore();

  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'citizen' | 'admin' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');

  // Modal tạo / sửa tài khoản
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountRecord | null>(null);
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fRole, setFRole] = useState<RoleOption>('citizen');
  const [fUnitId, setFUnitId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list();
      setAccounts(res.users || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối Backend để tải danh sách tài khoản. Hãy đảm bảo đã chạy run-backend.bat.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const kpi = useMemo(() => {
    let citizen = 0;
    let admin = 0;
    let fieldStaff = 0;
    accounts.forEach((a) => {
      if (a.role === 'citizen') citizen++;
      else if (a.role === 'officer' || a.role === 'leader') admin++;
      else fieldStaff++;
    });
    return { total: accounts.length, citizen, admin, fieldStaff };
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter((a) => {
      if (roleFilter === 'citizen' && a.role !== 'citizen') return false;
      if (roleFilter === 'admin' && a.role !== 'officer' && a.role !== 'leader') return false;
      if (roleFilter === 'staff' && a.role !== 'volunteer') return false;
      if (statusFilter === 'active' && !a.isActive) return false;
      if (statusFilter === 'locked' && a.isActive) return false;
      if (q) {
        const match =
          a.name.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [accounts, searchQuery, roleFilter, statusFilter]);

  const unitMap = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [units]);

  const openCreateModal = () => {
    setEditing(null);
    setFName('');
    setFPhone('');
    setFPassword('');
    setFRole('volunteer');
    setFUnitId('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (acc: AccountRecord) => {
    setEditing(acc);
    setFName(acc.name);
    setFPhone(acc.phone);
    setFPassword('');
    setFRole(acc.role);
    setFUnitId(acc.unitId || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fName.trim() || !fPhone.trim()) {
      setFormError('Vui lòng nhập đầy đủ họ tên và số điện thoại.');
      return;
    }
    if (!editing && fPassword.length < 6) {
      setFormError('Mật khẩu tạo mới phải có tối thiểu 6 ký tự.');
      return;
    }

    setSaving(true);
    try {
      const isStaff = ROLE_META[fRole].isStaff;
      if (editing) {
        const res = await usersApi.update(editing.id, {
          name: fName.trim(),
          phone: fPhone.trim(),
          ...(fPassword.length >= 6 ? { password: fPassword } : {}),
          role: fRole,
          unitId: isStaff ? fUnitId : '',
        });
        setAccounts((prev) => prev.map((a) => (a.id === editing.id ? res.user : a)));
        setNotice(
          isStaff
            ? `Đã cập nhật tài khoản "${res.user.name}" và đồng bộ sang trang Thành viên & Nhóm.`
            : `Đã cập nhật tài khoản "${res.user.name}".`
        );
      } else {
        const res = await usersApi.create({
          name: fName.trim(),
          phone: fPhone.trim(),
          password: fPassword,
          role: fRole,
          unitId: isStaff ? fUnitId : undefined,
        });
        setAccounts((prev) => [res.user, ...prev]);
        setNotice(
          isStaff
            ? `Đã tạo tài khoản "${res.user.name}" và tự động thêm vào danh sách Thành viên & Nhóm.`
            : `Đã tạo tài khoản công dân "${res.user.name}".`
        );
      }

      // Đồng bộ ngay store Thành viên & Nhóm
      await syncTeamsFromBackend();
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (acc: AccountRecord) => {
    try {
      const res = await usersApi.update(acc.id, { isActive: !acc.isActive });
      setAccounts((prev) => prev.map((a) => (a.id === acc.id ? res.user : a)));
      setNotice(
        res.user.isActive
          ? `Đã mở khóa tài khoản "${acc.name}".`
          : `Đã tạm khóa tài khoản "${acc.name}".`
      );
      await syncTeamsFromBackend();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái tài khoản.');
    }
  };

  const handleDelete = async (acc: AccountRecord) => {
    if (!confirm(`Xóa vĩnh viễn tài khoản "${acc.name}" (${acc.phone})?`)) return;
    try {
      await usersApi.remove(acc.id);
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      setNotice(`Đã xóa tài khoản "${acc.name}".`);
      await syncTeamsFromBackend();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa tài khoản.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Quản lý Tài khoản hệ thống
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý toàn bộ tài khoản Công dân, Quản trị viên và Đội xử lý — tài khoản Admin / Đội xử lý tạo mới tự động đồng bộ sang trang Thành viên
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadAccounts()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[5px] bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* THÔNG BÁO */}
      {notice && (
        <div className="p-3 rounded-[5px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. KPI TỔNG QUAN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tổng tài khoản</div>
            <div className="text-xl font-bold text-slate-800">{kpi.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Công dân</div>
            <div className="text-xl font-bold text-emerald-700">{kpi.citizen}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Quản trị viên</div>
            <div className="text-xl font-bold text-indigo-700">{kpi.admin}</div>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-[5px] bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Đội xử lý hiện trường</div>
            <div className="text-xl font-bold text-amber-700">{kpi.fieldStaff}</div>
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Tất cả (${kpi.total})` },
            { id: 'citizen', label: `Công dân (${kpi.citizen})` },
            { id: 'admin', label: `Admin (${kpi.admin})` },
            { id: 'staff', label: `Đội xử lý (${kpi.fieldStaff})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold border transition ${
                roleFilter === tab.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm họ tên, SĐT..."
              className="w-full h-9 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-[5px] border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* 4. BẢNG DANH SÁCH TÀI KHOẢN */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Đang tải danh sách tài khoản từ MongoDB...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <UserCog className="w-9 h-9 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">Không tìm thấy tài khoản nào</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Họ tên & Chức danh</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Liên hệ đăng nhập</th>
                  <th className="py-3 px-4">Đơn vị / Tổ đội</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filtered.map((acc) => {
                  const meta = ROLE_META[acc.role] || ROLE_META.citizen;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{acc.title}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border text-[11px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{acc.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {acc.unitId && unitMap.get(acc.unitId)
                          ? unitMap.get(acc.unitId)
                          : acc.department}
                      </td>
                      <td className="py-3 px-4">
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(acc)}
                            title="Chỉnh sửa"
                            className="p-1.5 rounded-[5px] text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(acc)}
                            title={acc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className="p-1.5 rounded-[5px] text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition"
                          >
                            {acc.isActive ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(acc)}
                            title="Xóa tài khoản"
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

      {/* MODAL TẠO / SỬA TÀI KHOẢN */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò tài khoản *
                </label>
                <select
                  value={fRole}
                  onChange={(e) => setFRole(e.target.value as RoleOption)}
                  className="w-full h-9 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="volunteer">Đội xử lý hiện trường</option>
                  <option value="officer">Quản trị viên (Admin)</option>
                  <option value="leader">Cán bộ Điều hành</option>
                  <option value="citizen">Công dân</option>
                </select>
              </div>

              {ROLE_META[fRole].isStaff && (
                <div className="p-2.5 rounded-[5px] bg-blue-50 border border-blue-200 text-[11px] text-blue-800 font-medium">
                  Tài khoản Quản trị viên / Đội xử lý sẽ tự động hiển thị thêm bên trang{' '}
                  <strong>Thành viên & Nhóm</strong> để phục vụ phân công.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="VD: Trần Minh Quân"
                  className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={fPhone}
                  onChange={(e) => setFPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {ROLE_META[fRole].isStaff && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thuộc Tổ đội (tùy chọn)
                  </label>
                  <select
                    value={fUnitId}
                    onChange={(e) => setFUnitId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Không thuộc tổ đội nào</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                </label>
                <input
                  type="password"
                  required={!editing}
                  minLength={editing ? undefined : 6}
                  value={fPassword}
                  onChange={(e) => setFPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full h-9 px-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-[5px] border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white"
                >
                  {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

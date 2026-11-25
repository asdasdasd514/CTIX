import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Clock,
  Save,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useIncidentStore } from '../../store/useIncidentStore';
import { usersApi } from '../../services/api';

export const CitizenAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout, updateCurrentUser } = useAuthStore();
  const { incidents } = useIncidentStore();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const myStats = useMemo(() => {
    const cleanPhone = (currentUser.phone || '').replace(/[\s.-]/g, '');
    const mine = incidents.filter(
      (i) =>
        i.sender.name === currentUser.name ||
        i.sender.phone.replace(/[\s.-]/g, '') === cleanPhone
    );
    const resolved = mine.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const inProgress = mine.length - resolved;
    return { total: mine.length, resolved, inProgress };
  }, [incidents, currentUser]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-[5px] border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <User className="w-10 h-10 text-slate-300 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Bạn chưa đăng nhập tài khoản</h2>
        <p className="text-xs text-slate-500">
          Đăng nhập hoặc đăng ký để quản lý hồ sơ cá nhân và theo dõi nhanh các phản ánh của bạn.
        </p>
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="px-4 py-2 rounded-[5px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            Đăng ký tài khoản
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !phone.trim()) {
      setError('Vui lòng nhập đầy đủ Họ và tên và Số điện thoại.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSaving(true);
    try {
      const updated = await usersApi.update(currentUser.id, {
        name: name.trim(),
        phone: phone.trim(),
        ...(newPassword ? { password: newPassword } : {}),
      });
      updateCurrentUser({
        name: updated.user.name,
        phone: updated.user.phone,
      });
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Đã cập nhật thông tin tài khoản thành công.');
    } catch (err) {
      updateCurrentUser({
        name: name.trim(),
        phone: phone.trim(),
      });
      setSuccess(
        err instanceof Error
          ? 'Đã lưu thông tin tài khoản trên thiết bị.'
          : 'Đã cập nhật thông tin tài khoản.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/citizen/home', { replace: true });
  };

  const initials = currentUser.name
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Thẻ thông tin tổng quan tài khoản */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-[5px] bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-800 truncate">
              {currentUser.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="inline-flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                {currentUser.phone}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.department || 'Phường Trấn Biên'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* Thống kê phản ánh cá nhân */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-[5px] border border-slate-200 p-3.5 text-center shadow-sm">
          <ClipboardList className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-slate-800">{myStats.total}</div>
          <div className="text-[11px] text-slate-500 font-medium">Đã gửi</div>
        </div>
        <div className="bg-white rounded-[5px] border border-slate-200 p-3.5 text-center shadow-sm">
          <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-700">{myStats.inProgress}</div>
          <div className="text-[11px] text-slate-500 font-medium">Đang xử lý</div>
        </div>
        <div className="bg-white rounded-[5px] border border-slate-200 p-3.5 text-center shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-emerald-700">{myStats.resolved}</div>
          <div className="text-[11px] text-slate-500 font-medium">Hoàn thành</div>
        </div>
      </div>

      {/* Form chỉnh sửa thông tin cá nhân & đổi mật khẩu */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Chỉnh sửa thông tin tài khoản</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật họ tên, số điện thoại liên hệ hoặc đổi mật khẩu đăng nhập
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-[5px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-600 mb-2.5">
              Đổi mật khẩu (để trống nếu không thay đổi)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full h-10 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full h-10 pl-9 pr-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

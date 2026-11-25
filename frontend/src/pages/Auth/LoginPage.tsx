import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, User, ArrowRight, ShieldCheck, Users, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAs, loginWithCredentials } = useAuthStore();

  const [username, setUsername] = useState('admin@tranbien.gov.vn');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithCredentials(username, password);
      if (user.role === 'citizen') {
        navigate('/citizen/home', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCitizen = () => {
    loginAs('citizen');
    navigate('/citizen/home', { replace: true });
  };

  const handleQuickAdmin = () => {
    loginAs('officer');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-blue-950 overflow-hidden">
      {/* Ảnh nền Văn Miếu Trấn Biên */}
      <img
        src="/images/tran-bien-banner.jpg"
        alt="Văn Miếu Trấn Biên"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-950/85 to-blue-900/80" />

      <div className="relative z-10 max-w-md w-full bg-white rounded-[5px] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header thương hiệu CTIX */}
        <div className="bg-blue-950 text-white px-6 py-6 text-center border-b border-blue-900">
          <div className="w-14 h-14 rounded-[5px] overflow-hidden bg-white border-2 border-white/20 flex items-center justify-center mx-auto mb-3 shadow-md">
            <img
              src="/images/ctix-logo.jpg"
              alt="CTIX Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-[5px] border border-white/15 inline-block">
            Trấn Biên SmartCity • CTIX
          </span>
          <h1 className="text-lg sm:text-xl font-bold mt-2 text-white tracking-tight">
            Đăng Nhập Hệ Thống
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Cổng Tiếp Nhận & Điều Phối Phản Ánh Hiện Trường Phường Trấn Biên
          </p>
        </div>

        {/* Form đăng nhập thật + 2 nút đăng nhập nhanh */}
        <div className="p-6 space-y-5 bg-white">
          {error && (
            <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email / Số điện thoại:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@tranbien.gov.vn hoặc SĐT..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 2 Nút đăng nhập nhanh: Công dân & Admin */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase text-center tracking-wider">
              Đăng nhập nhanh theo vai trò
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleQuickCitizen}
                className="py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-500 rounded-[5px] font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Công dân</span>
              </button>

              <button
                type="button"
                onClick={handleQuickAdmin}
                className="py-3 px-4 bg-blue-950 hover:bg-blue-900 text-white border border-blue-950 rounded-[5px] font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

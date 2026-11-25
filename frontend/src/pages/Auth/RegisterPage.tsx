import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Phone, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCitizen } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/[\s.-]/g, '').trim();
    if (!/^0\d{8,10}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (ví dụ: 0912345678).');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
      return;
    }

    setLoading(true);
    try {
      await registerCitizen({
        name: name.trim() || undefined,
        phone: cleanPhone,
        password,
        confirmPassword,
      });
      navigate('/citizen/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-blue-950 overflow-hidden">
      {/* Ảnh nền Đồng Nai Số */}
      <img
        src="/images/tran-bien-banner.jpg"
        alt="Đồng Nai Số"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-950/85 to-blue-900/80" />

      <div className="relative z-10 max-w-md w-full bg-white rounded-[5px] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header thương hiệu CTIX */}
        <div className="bg-blue-950 text-white px-6 py-5 text-center border-b border-blue-900">
          <div className="w-12 h-12 rounded-[5px] overflow-hidden bg-white border-2 border-white/20 flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <img
              src="/images/ctix-logo.jpg"
              alt="CTIX Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-[5px] border border-white/15 inline-block">
            Cổng Công Dân • Đồng Nai
          </span>
          <h1 className="text-lg sm:text-xl font-bold mt-2 text-white tracking-tight">
            Đăng Ký Tài Khoản Công Dân
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Tạo tài khoản nhanh bằng số điện thoại để gửi và theo dõi phản ánh
          </p>
        </div>

        {/* Form đăng ký */}
        <div className="p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Họ và tên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Số điện thoại: *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0912345678)"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mật khẩu: *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Xác nhận mật khẩu: *
              </label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-[5px] text-xs sm:text-sm font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[5px] text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 text-center text-xs text-slate-600">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-700 hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

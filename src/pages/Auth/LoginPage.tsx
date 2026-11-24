import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, PRESET_ACCOUNTS } from '../../store/useAuthStore';
import { Shield, Lock, User, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAs } = useAuthStore();

  const [username, setUsername] = useState('long.nt@tranbien.dongnai.gov.vn');
  const [password, setPassword] = useState('••••••••');

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAs('officer');
    navigate('/inbox');
  };

    const handleQuickLogin = (role: keyof typeof PRESET_ACCOUNTS) => {
    loginAs(role);
    if (role === 'leader') navigate('/dashboard');
    else if (role === 'officer') navigate('/inbox');
    else if (role === 'volunteer') navigate('/field/tasks');
    else navigate('/citizen/home');
  };

  return (
    <div className="min-h-screen bg-[#0b1329] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Quốc huy / Biểu tượng tinh tế */}
        <div className="bg-[#0f172a] text-white p-6 text-center border-b border-slate-800">
          <div className="w-13 h-13 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-900/50 px-2.5 py-0.5 rounded-full inline-block">
            CỔNG DỊCH VỤ CÔNG TRỰC TUYẾN
          </span>
          <h1 className="text-base sm:text-lg font-extrabold mt-1 text-white">
            UBND Phường Trấn Biên
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hệ Thống Giám Sát, Tiếp Nhận & Điều Phối Phản Ánh Hiện Trường
          </p>
        </div>

        {/* Form Đăng Nhập Tiêu Chuẩn */}
        <form onSubmit={handleFormLogin} className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tài khoản công vụ / CCCD / Email:
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Mật khẩu truy cập:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0f3b7d] hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <span>Đăng nhập hệ thống</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Chọn Đăng Nhập Nhanh Cho Buổi Báo Cáo / Hackathon Demo */}
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase text-center mb-2">
              Hoặc chọn nhanh vai trò để trải nghiệm:
            </span>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('officer')}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-200 text-slate-800 text-xs font-bold flex items-center justify-between transition text-left group"
              >
                <div>
                  <div className="group-hover:text-blue-700">🏛️ Cán bộ Tiếp nhận & Phân loại</div>
                  <div className="text-[10px] text-slate-400 font-normal">Nguyễn Thành Long • Màn hình 04 & 05</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('leader')}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50/70 hover:border-purple-200 text-slate-800 text-xs font-bold flex items-center justify-between transition text-left group"
              >
                <div>
                  <div className="group-hover:text-purple-700">📊 Cán bộ Điều hành Chủ Trì (IOC)</div>
                  <div className="text-[10px] text-slate-400 font-normal">Trần Văn Minh • Màn hình 01 Tổng quan</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('volunteer')}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50/70 hover:border-emerald-200 text-slate-800 text-xs font-bold flex items-center justify-between transition text-left group"
              >
                <div>
                  <div className="group-hover:text-emerald-700">🤝 Đội Thanh niên Tình nguyện</div>
                  <div className="text-[10px] text-slate-400 font-normal">Lê Hoàng Nam • Xác minh tại chỗ & Nghiệm thu</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('citizen')}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50/70 hover:border-amber-200 text-slate-800 text-xs font-bold flex items-center justify-between transition text-left group"
              >
                <div>
                  <div className="group-hover:text-amber-700">👤 Người dân Phường Trấn Biên</div>
                  <div className="text-[10px] text-slate-400 font-normal">Bác Hai Trấn Biên • Gửi 3 bước & Đánh giá</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

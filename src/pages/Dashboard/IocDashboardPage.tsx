import React, { useState } from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useNavigate } from 'react-router-dom';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Waves,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const IocDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();

  const [mapCategory, setMapCategory] = useState<'all' | 'flood' | 'light' | 'waste'>('all');

  const mapFilteredIncidents = incidents.filter((item) => {
    if (mapCategory === 'flood' && item.category !== 'flooding') return false;
    if (mapCategory === 'light' && item.category !== 'street_light') return false;
    if (mapCategory === 'waste' && item.category !== 'waste') return false;
    return true;
  });

  const total = incidents.length;
  const resolved = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
  const pending = incidents.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* 4 Thẻ KPI Đầu Trang (Chuẩn Màn 1 trong ảnh tham chiếu: Nền trắng, viền thanh lịch, số liệu to rõ) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng tiếp nhận */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TỔNG TIẾP NHẬN</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">12.450</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ +12.4%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Phường Trấn Biên: <strong className="text-slate-700">{total} phản ánh</strong> số hóa tháng 11/2026
          </div>
        </div>

        {/* KPI 2: Tỷ lệ giải quyết đúng hạn */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TỶ LỆ GIẢI QUYẾT ĐÚNG HẠN</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">94,2%</span>
            <span className="text-xs font-semibold text-slate-500">Mục tiêu: &gt;90%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <strong className="text-slate-700">{resolved}/{total} phản ánh</strong> đã nghiệm thu hoàn thành
          </div>
        </div>

        {/* KPI 3: Thời gian xử lý trung bình */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">THỜI GIAN XỬ LÝ TB</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              14,5 <span className="text-sm font-medium text-slate-500">giờ/vụ</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Nhanh hơn 18%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Phường Trấn Biên: TB <strong className="text-slate-700">3,2 ngày</strong> theo chuẩn đề thi
          </div>
        </div>

        {/* KPI 4: Mức độ hài lòng */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MỨC ĐỘ HÀI LÒNG</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-500 tracking-tight">96,8%</span>
            <span className="text-xs font-bold text-slate-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              ⭐ 4.8 / 5.0
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Dựa trên <strong className="text-slate-700">11.230 lượt</strong> công dân đánh giá
          </div>
        </div>
      </div>

      {/* Grid Bố Cục 2 Cột Desktop: Trái (8/12) Bản Đồ & Ngành | Phải (4/12) Thi Đua & Sự Kiện Khẩn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI (8 / 12 col): Bản đồ số hiện trường + Cơ cấu sự cố */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card Bản Đồ Số Hiện Trường */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Bản Đồ Số Hiện Trường</h3>
                <span className="text-xs text-slate-400 hidden sm:inline">• Giám sát không gian trực quan</span>
              </div>
              <button
                onClick={() => navigate('/map')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                <span>Xem bản đồ chi tiết</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Khung Bản đồ OpenStreetMap (OSM) Thực Tế (Phường Trấn Biên) */}
            <div className="relative h-[360px] bg-slate-100 overflow-hidden">
              <OpenStreetMap
                height="360px"
                incidents={mapFilteredIncidents}
                selectedId="inc-1"
              />
            </div>

            {/* Thanh Tag Lọc Dưới Bản Đồ (Y HỆT ẢNH MẪU) */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 uppercase text-[11px]">Bộ lọc sự cố:</span>
              <button
                onClick={() => setMapCategory('all')}
                className={`px-3 py-1 rounded-full font-bold border transition ${
                  mapCategory === 'all'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tất cả: 760 vụ
              </button>
              <button
                onClick={() => setMapCategory('flood')}
                className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1 transition ${
                  mapCategory === 'flood'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Waves className="w-3.5 h-3.5 text-blue-500" /> Ngập nước & Cống: 68
              </button>
              <button
                onClick={() => setMapCategory('light')}
                className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1 transition ${
                  mapCategory === 'light'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Chiếu sáng: 240
              </button>
              <button
                onClick={() => setMapCategory('waste')}
                className={`px-3 py-1 rounded-full font-bold border flex items-center gap-1 transition ${
                  mapCategory === 'waste'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-emerald-500" /> Rác thải: 182
              </button>
            </div>
          </div>

          {/* Hàng 2 Thẻ Dưới: Cơ Cấu Tiếp Nhận & Thời Gian Xử Lý TB Theo Ngành */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Cơ cấu tiếp nhận */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-3">
                Cơ Cấu Tiếp Nhận Sự Cố Hiện Trường
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Giao thông & Mặt đường (41%)</span>
                    <span className="text-rose-600">4.120 vụ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '41%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Vệ sinh môi trường - Rác thải (28%)</span>
                    <span className="text-emerald-600">3.850 vụ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Chiếu sáng đô thị (24%)</span>
                    <span className="text-amber-600">2.410 vụ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '24%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Thoát nước & Điểm ngập úng (7%)</span>
                    <span className="text-blue-600">1.540 vụ</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '7%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Thời gian xử lý trung bình theo ngành */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-3">
                Thời Gian Xử Lý Trung Bình Theo Ngành
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Chiếu sáng đô thị</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ⚡ 8,2 giờ (Chuẩn)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Vệ sinh môi trường</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    ⚡ 12,0 giờ (Chuẩn)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Thoát nước & Cống nghẹt</span>
                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    16,0 giờ
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Hạ tầng giao thông / Ổ gà</span>
                  <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    18,5 giờ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 / 12 col): Bảng Xếp Hạng Thi Đua & Bảng Sự Kiện Khẩn Cấp (Y HỆT ẢNH MẪU) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Bảng Xếp Hạng Thi Đua 30 Xã / Phường */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  BẢNG XẾP HẠNG THI ĐUA 30 XÃ / PHƯỜNG
                </h3>
                <span className="text-[11px] text-slate-400">Đánh giá theo tỷ lệ giải quyết đúng hạn</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                T11/2026
              </span>
            </div>

            {/* Top 3 Đơn vị xuất sắc */}
            <div className="space-y-2 mb-3">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                ★ TOP ĐƠN VỊ DẪN ĐẦU TIÊU BIỂU:
              </span>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <span className="font-bold text-slate-800">UBND Phường Quyết Thắng</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-700">98,1%</div>
                  <div className="text-[10px] text-amber-500 font-bold">4.9 ⭐</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    2
                  </span>
                  <span className="font-bold text-slate-800">UBND Phường Thống Nhất</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800">96,5%</div>
                  <div className="text-[10px] text-amber-500 font-bold">4.8 ⭐</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                    3
                  </span>
                  <span className="font-bold text-slate-800">UBND Xã An Phước (Long Thành)</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-800">95,8%</div>
                  <div className="text-[10px] text-amber-500 font-bold">4.7 ⭐</div>
                </div>
              </div>
            </div>

            {/* Khối Viền Đỏ Cảnh Báo: Đơn vị chậm xử lý cần đôn đốc */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                ĐƠN VỊ CHẬM XỬ LÝ CẦN ĐÔN ĐỐC (CẦN ĐIỀU PHỐI GẤP):
              </span>
              <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-rose-900">UBND Phường Trấn Biên</div>
                  <div className="text-[11px] text-rose-700">
                    Thời gian TB: <strong>3,2 ngày</strong> ({pending} hồ sơ đang chờ)
                  </div>
                </div>
                <button
                  onClick={() => navigate('/inbox')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] shadow-xs transition"
                >
                  Điều phối ngay
                </button>
              </div>
            </div>
          </div>

          {/* Card Bảng Sự Kiện Khẩn Cấp Cần Chỉ Đạo Ngay */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-rose-700 text-xs sm:text-sm uppercase">
                  BẢNG SỰ KIỆN KHẨN CẤP CẦN CHỈ ĐẠO
                </h3>
              </div>
              <button
                onClick={() => navigate('/inbox')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Sự cố khẩn 1 */}
              <div
                onClick={() => navigate('/dispatch/inc-1')}
                className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 transition cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span>Ổ gà sâu đoạn ngã ba Võ Thị Sáu - Cách Mạng Tháng 8</span>
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">Khẩn cấp</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">
                  Mặt đường lún sâu 18cm, người đi xe máy rất dễ trượt ngã ban đêm.
                </p>
                <div className="mt-1.5 text-[10px] text-rose-700 flex items-center justify-between font-semibold">
                  <span>📍 160 Võ Thị Sáu, P. Trấn Biên</span>
                  <span className="text-blue-700 font-bold">Click để phân công →</span>
                </div>
              </div>

              {/* Sự cố khẩn 2 */}
              <div
                onClick={() => navigate('/dispatch/inc-2')}
                className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 transition cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Cột điện nghiêng, ngõ 2 Tân Mai - nguy cơ đứt dây</span>
                  <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold">Ưu tiên cao</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">
                  Dây điện võng sát nóc nhà dân sau trận dông lốc chiều qua.
                </p>
                <div className="mt-1.5 text-[10px] text-amber-800 flex items-center justify-between font-semibold">
                  <span>📍 Hẻm 42 Nguyễn Ái Quốc, P. Trấn Biên</span>
                  <span className="text-blue-700 font-bold">Click để phân công →</span>
                </div>
              </div>

              {/* Sự cố khẩn 3 */}
              <div
                onClick={() => navigate('/dispatch/inc-3')}
                className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition cursor-pointer"
              >
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Ứ đọng cống nghẹt đường Huỳnh Văn Nghệ</span>
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">Cần xử lý</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">
                  Mưa ngập 35cm đoạn trước trường tiểu học, xe chết máy hàng loạt.
                </p>
                <div className="mt-1.5 text-[10px] text-blue-800 flex items-center justify-between font-semibold">
                  <span>📍 84 Huỳnh Văn Nghệ, P. Trấn Biên</span>
                  <span className="text-blue-700 font-bold">Click để phân công →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

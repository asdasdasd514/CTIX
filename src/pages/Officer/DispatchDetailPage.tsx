import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Users,
} from 'lucide-react';

const RESPONSE_TEAMS = [
  {
    id: 'team-csgt',
    name: 'Đội CSGT / Trật tự Phường Trấn Biên',
    role: 'Phụ trách bảo đảm giao thông & rào chắn',
    distance: '120m (Sẵn sàng xuất kích)',
    phone: '0912.345.678',
  },
  {
    id: 'team-qldt',
    name: 'Phòng Quản lý Đô thị TP. Biên Hòa',
    role: 'Đội bảo trì hạ tầng đường bộ & chiếu sáng',
    distance: '850m (Đang tuần tra)',
    phone: '0988.765.432',
  },
  {
    id: 'team-tn',
    name: 'Đội Thanh niên Tình nguyện Phường Trấn Biên',
    role: 'Xác minh tại chỗ & Hỗ trợ người dân',
    distance: '350m (Có mặt tại trụ sở)',
    phone: '0977.112.233',
  },
];

export const DispatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { incidents, assignIncident } = useIncidentStore();

  const incident = incidents.find((i) => i.id === id) || incidents[0];

  const [selectedTeam, setSelectedTeam] = useState<string>(RESPONSE_TEAMS[0].id);
  const [dispatchNote, setDispatchNote] = useState<string>(
    'Yêu cầu khẩn trương rào chắn cảnh báo an toàn giao thông, cử lực lượng vá dặm hoàn thành trong vòng 24 giờ.'
  );
  const [sendZaloSms, setSendZaloSms] = useState<boolean>(true);
  const [deadlineDays, setDeadlineDays] = useState<number>(1);

  const handleConfirmDispatch = () => {
    const teamObj = RESPONSE_TEAMS.find((t) => t.id === selectedTeam) || RESPONSE_TEAMS[0];
    assignIncident(incident.id, teamObj.name, deadlineDays, 'Cán bộ Nguyễn Thành Long');
    alert(`Đã phân công thành công cho [${teamObj.name}]! Hệ thống đã gửi tin nhắn Zalo/SMS điều động.`);
    navigate('/inbox');
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Quay lại danh sách hồ sơ */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/inbox')}
            className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </button>
          <span>/</span>
          <span>Phân công điều phối</span>
          <span>/</span>
          <span className="font-mono font-bold text-slate-800">Hồ sơ số {incident.code}</span>
        </div>
      </div>

      {/* Header Thẻ Hồ Sơ Phân Công (Chuẩn Màn 3 trong ảnh) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {incident.code}
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded flex items-center gap-1 border border-rose-200">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              Còn phải xử lý trong: 22 giờ 15 phút (SLA)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {incident.title}
          </h2>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{incident.location.address}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-semibold uppercase">Người báo tin:</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {incident.sender.name} ({incident.sender.phone})
          </span>
        </div>
      </div>

      {/* Grid 2 Cột Desktop: Trái Chi Tiết & Ảnh | Phải Chọn Đội Tiếp Ứng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* CỘT TRÁI (7 / 12 col): Chi tiết sự cố, ảnh lớn, bản đồ vị trí */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">LĨNH VỰC BÁO CÁO:</span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                Giao thông - Hạ tầng đường bộ đô thị
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mô tả hiện trường từ người dân:
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 leading-relaxed">
                "{incident.description}"
              </div>
            </div>

            {/* Ảnh Hiện Trường Kích Thước Lớn */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ảnh chụp thực tế từ hiện trường:
              </label>
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative shadow-2xs">
                <img
                  src={incident.photosBefore[0]}
                  alt="Hiện trường sự cố"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  Ghi nhận GPS: {incident.location.lat}, {incident.location.lng}
                </div>
              </div>
            </div>

            {/* Bản Đồ Vị Trí Sự Cố OpenStreetMap */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Bản đồ số vị trí sự cố trên địa bàn Phường:
              </label>
              <div className="h-48 w-full rounded-lg overflow-hidden border border-slate-200 shadow-2xs relative">
                <OpenStreetMap
                  height="192px"
                  center={[incident.location.lat, incident.location.lng]}
                  zoom={16}
                  singlePin={{
                    lat: incident.location.lat,
                    lng: incident.location.lng,
                    label: incident.location.address,
                  }}
                  incidents={[incident]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 / 12 col): Nhân sự / Đội tiếp ứng (Chuẩn ảnh Màn 3) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                  NHÂN SỰ / ĐỘI TIẾP ỨNG
                </h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● 3 Lực lượng trực ban
              </span>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Chế độ: Đơn vị trực ban quanh điểm sự cố
            </div>

            {/* Danh Sách Đội Trực Ban (Chuẩn Màn 3) */}
            <div className="space-y-2.5">
              {RESPONSE_TEAMS.map((team) => {
                const isSelected = selectedTeam === team.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{team.name}</div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        {team.distance}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{team.role}</div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-blue-700 font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {team.phone}
                      </span>
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Đang chọn' : 'Click để chọn'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hạn cam kết giải quyết (SLA) */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                Thời hạn hoàn thành (SLA):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 1, label: 'Khẩn cấp (24h)' },
                  { days: 3, label: 'Chuẩn (3 ngày)' },
                  { days: 5, label: 'Mở rộng (5 ngày)' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.days}
                    onClick={() => setDeadlineDays(opt.days)}
                    className={`p-2 rounded-lg border text-xs font-bold text-center transition ${
                      deadlineDays === opt.days
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ghi chú chỉ đạo cho đơn vị */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                Chỉ đạo của Cán bộ phân công:
              </label>
              <textarea
                rows={3}
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Checkbox gửi tin Zalo/SMS */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendZaloSms}
                  onChange={(e) => setSendZaloSms(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Gửi tin nhắn thông báo qua Zalo / SMS cho Đội tiếp nhận</span>
              </label>
            </div>

            {/* Nút Phân Công */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/inbox')}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="flex-1 py-2.5 bg-[#0f3b7d] hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Xác nhận phân công</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

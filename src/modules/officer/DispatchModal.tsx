import React, { useState } from 'react';
import { Incident } from '../../types/incident';
import { useIncidentStore } from '../../store/useIncidentStore';
import { X, Send, Clock, Building, ShieldCheck } from 'lucide-react';

interface Props {
  incident: Incident;
  onClose: () => void;
}

const DEPARTMENTS = [
  'Đội Trật tự Đô thị Phường Trấn Biên',
  'Công ty Chiếu sáng Đô thị Biên Hòa',
  'Công ty Cổ phần Cấp thoát nước Trấn Biên',
  'Đội Thanh niên Tình nguyện Phường (Xác minh tại chỗ)',
  'Hợp tác xã Vệ sinh Môi trường Trấn Biên',
];

export const DispatchModal: React.FC<Props> = ({ incident, onClose }) => {
  const { assignIncident } = useIncidentStore();

  const [selectedUnit, setSelectedUnit] = useState<string>(
    incident.category === 'street_light' ? DEPARTMENTS[1] :
    incident.category === 'flooding' ? DEPARTMENTS[2] :
    incident.category === 'waste' ? DEPARTMENTS[4] : DEPARTMENTS[0]
  );
  const [deadlineDays, setDeadlineDays] = useState<number>(3);
  const [officerName, setOfficerName] = useState<string>('Cán bộ Nguyễn Hữu Nghĩa (UBND Phường)');

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    assignIncident(incident.id, selectedUnit, deadlineDays, officerName);
    alert(`Đã giao việc thành công cho [${selectedUnit}] với thời hạn SLA là ${deadlineDays} ngày!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#0f3b7d] text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded font-semibold">
              Màn hình 4 • Điều phối & Phân công xử lý
            </span>
            <h3 className="text-base sm:text-lg font-bold mt-1">Giao Xử Lý Phản Ánh Hiện Trường</h3>
            <p className="text-xs text-blue-100">Hồ sơ số: {incident.code}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleDispatch} className="p-4 sm:p-5 space-y-4">
          {/* Thông tin sự cố */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">{incident.title}</div>
            <div className="text-slate-600">📍 Địa chỉ: {incident.location.address}</div>
            <div className="text-slate-500">👤 Người gửi: {incident.sender.name} ({incident.sender.phone})</div>
          </div>

          {/* Chọn đơn vị giao việc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Chỉ định đơn vị / lực lượng phụ trách:</span>
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Thiết lập hạn xử lý (SLA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Thời hạn cam kết xử lý (SLA):</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { days: 1, label: 'Khẩn cấp (24 giờ)' },
                { days: 3, label: 'Chuẩn (3 ngày)' },
                { days: 5, label: 'Mở rộng (5 ngày)' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.days}
                  onClick={() => setDeadlineDays(opt.days)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition text-center ${
                    deadlineDays === opt.days
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tên cán bộ tiếp nhận giao việc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cán bộ ký quyết định giao việc:
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#0f3b7d] hover:bg-blue-800 text-white rounded-lg font-bold shadow transition flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Giao việc & Kích hoạt SLA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

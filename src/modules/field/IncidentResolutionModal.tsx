import React, { useState } from 'react';
import { Incident } from '../../types/incident';
import { useIncidentStore } from '../../store/useIncidentStore';
import { X, CheckCircle2, Camera, MapPin } from 'lucide-react';

interface Props {
  incident: Incident;
  onClose: () => void;
}

const SAMPLE_AFTER_PHOTOS = [
  'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
];

export const IncidentResolutionModal: React.FC<Props> = ({ incident, onClose }) => {
  const { resolveIncident } = useIncidentStore();

  const [afterPhoto, setAfterPhoto] = useState<string>(SAMPLE_AFTER_PHOTOS[0]);
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    'Đã huy động lực lượng khắc phục xong hoàn toàn lúc 14h30. Đã thu dọn sạch sẽ và hoàn trả mặt đường an toàn cho người dân.'
  );
  const [officerName, setOfficerName] = useState<string>('Tổ Phản Ứng Nhanh & Thanh Niên Phường Trấn Biên');

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    resolveIncident(incident.id, resolutionNotes, [afterPhoto], officerName);
    alert('Nghiệm thu thành công! Kết quả kèm ảnh sau xử lý đã được công khai minh bạch cho người dân.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0f3b7d] text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded font-semibold">
              Màn hình 5 • Cập nhật kết quả nghiệm thu hiện trường
            </span>
            <h3 className="text-base sm:text-lg font-bold mt-1">Nghiệm Thu Hoàn Thành Sự Cố</h3>
            <p className="text-xs text-blue-100">Hồ sơ: {incident.code}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleResolve} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Thông tin sự cố */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-slate-800">{incident.title}</div>
            <div className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{incident.location.address}</span>
            </div>
          </div>

          {/* So Sánh 2 Cột Đối Chứng: Trước (Before) vs Sau (After) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Đối chứng minh chứng hiện trường (Trước vs Sau xử lý):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cột 1: Ảnh lúc người dân phản ánh */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-rose-600 block">
                  1. Ảnh ban đầu (Trước khi xử lý):
                </span>
                <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-rose-300 bg-slate-100">
                  <img
                    src={incident.photosBefore[0]}
                    alt="Trước xử lý"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Cột 2: Ảnh sau khi đã sửa chữa/dọn dẹp */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-600 block">
                  2. Ảnh nghiệm thu (Sau khi xử lý xong):
                </span>
                <div className="aspect-video w-full rounded-lg overflow-hidden border-2 border-emerald-400 bg-slate-100 relative">
                  <img
                    src={afterPhoto}
                    alt="Sau xử lý"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                    Đã kiểm tra GPS
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn ảnh mẫu nghiệm thu */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">Đổi ảnh sau xử lý:</span>
              {SAMPLE_AFTER_PHOTOS.map((photo, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setAfterPhoto(photo)}
                  className={`w-9 h-7 rounded overflow-hidden border-2 transition ${
                    afterPhoto === photo ? 'border-emerald-600 ring-2 ring-emerald-300' : 'border-slate-300 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú kết quả xử lý */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nội dung biên bản nghiệm thu hoàn thành:
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ghi rõ biện pháp khắc phục, thời gian hoàn tất..."
              required
            />
          </div>

          {/* Lực lượng thực hiện */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Đơn vị / Cán bộ nghiệm thu:
            </label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow transition flex items-center justify-center gap-1.5 text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận hoàn thành & Công khai</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

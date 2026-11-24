import React, { useState } from 'react';
import { Incident } from '../../types/incident';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Star, CheckCircle2, X } from 'lucide-react';

interface Props {
  incident: Incident;
  onClose: () => void;
}

const CRITERIA_OPTIONS = [
  'Xử lý nhanh chóng, đúng thời hạn',
  'Hiện trường sạch sẽ, khắc phục triệt để',
  'Cán bộ/Thợ kỹ thuật nhiệt tình, lịch sự',
  'Thông báo tiến độ rõ ràng, minh bạch',
];

export const CitizenRatingModal: React.FC<Props> = ({ incident, onClose }) => {
  const { rateIncident, elderlyMode } = useIncidentStore();
  const [stars, setStars] = useState<number>(5);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    'Xử lý nhanh chóng, đúng thời hạn',
    'Hiện trường sạch sẽ, khắc phục triệt để',
  ]);
  const [comment, setComment] = useState<string>('Tôi rất hài lòng với tốc độ khắc phục của UBND Phường. Cảm ơn các cán bộ!');

  const toggleCriteria = (item: string) => {
    if (selectedCriteria.includes(item)) {
      setSelectedCriteria(selectedCriteria.filter((c) => c !== item));
    } else {
      setSelectedCriteria([...selectedCriteria, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rateIncident(incident.id, stars, selectedCriteria, comment);
    alert('Cảm ơn Bác/Cô/Anh/Chị đã gửi đánh giá hài lòng! Ý kiến này sẽ được chuyển trực tiếp tới Lãnh đạo Phường Trấn Biên.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-none shadow-2xl max-w-lg w-full overflow-hidden border border-slate-400">
        {/* Header (GÓC VUÔNG) */}
        <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-none font-semibold">
              Màn hình 6 • Đánh giá mức độ hài lòng
            </span>
            <h3 className="text-base sm:text-lg font-bold mt-1">Đánh Giá Kết Quả Xử Lý</h3>
            <p className="text-xs text-blue-100">Hồ sơ số: {incident.code}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-none hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Thông tin tóm tắt sự cố (GÓC VUÔNG) */}
          <div className="bg-slate-50 p-3 rounded-none border border-slate-300 text-xs">
            <div className="font-semibold text-slate-800 line-clamp-1">{incident.title}</div>
            <div className="text-slate-500 mt-0.5">{incident.location.address}</div>
          </div>

          {/* Chọn số sao */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Bác/Anh/Chị đánh giá mức độ hài lòng:
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setStars(star)}
                  className="p-1 hover:scale-110 transition focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 ${
                      star <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-sm font-bold text-amber-600 mt-1">
              {stars === 5 && '⭐⭐⭐⭐⭐ Rất hài lòng'}
              {stars === 4 && '⭐⭐⭐⭐ Hài lòng'}
              {stars === 3 && '⭐⭐⭐ Bình thường'}
              {stars === 2 && '⭐⭐ Chưa hài lòng'}
              {stars === 1 && '⭐ Rất thất vọng'}
            </div>
          </div>

          {/* Tiêu chí nhanh (GÓC VUÔNG) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Chọn các điểm Bác/Anh/Chị thấy ưng ý:
            </label>
            <div className="space-y-1.5">
              {CRITERIA_OPTIONS.map((item) => {
                const isChecked = selectedCriteria.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleCriteria(item)}
                    className={`w-full text-left p-2.5 rounded-none border text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                      isChecked
                        ? 'border-blue-700 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item}</span>
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ý kiến góp ý (GÓC VUÔNG) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ý kiến góp ý thêm (nếu có):
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs sm:text-sm focus:ring-1 focus:ring-blue-600 focus:outline-none"
              placeholder="Nhập nhận xét hoặc lời nhắn gửi..."
            />
          </div>

          {/* Nút hành động (GÓC VUÔNG) */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-none text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Để sau
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-none font-bold shadow-sm transition flex items-center justify-center gap-1.5 ${
                elderlyMode ? 'text-base py-3' : 'text-xs sm:text-sm'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gửi đánh giá & Đóng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

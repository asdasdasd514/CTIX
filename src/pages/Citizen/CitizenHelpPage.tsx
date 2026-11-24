import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Phone,
  ChevronDown,
  Camera,
  Send,
  MessageSquare,
} from 'lucide-react';

const FAQS = [
  {
    q: 'Thời gian giải quyết phản ánh của UBND Phường là bao lâu?',
    a: 'Theo quy chế tiếp nhận của UBND Phường Trấn Biên: Hồ sơ được cán bộ tiếp nhận trong vòng 2 giờ làm việc. Đội phản ứng nhanh sẽ khảo sát trong vòng 12 giờ và thời hạn hoàn thành khắc phục (SLA) từ 24h - 48h tùy theo mức độ khẩn cấp của sự cố.',
  },
  {
    q: 'Tôi có thể chụp ảnh trực tiếp hoặc tải ảnh từ máy tính/điện thoại lên không?',
    a: 'Hoàn toàn được! Bạn có thể nhấn nút "Chọn ảnh từ máy tính / điện thoại" để tải file ảnh thực tế từ thiết bị của mình. Hệ thống còn hỗ trợ phân loại nhanh sự cố theo hình ảnh.',
  },
  {
    q: 'Làm thế nào để chọn vị trí sự cố khi tôi không nhớ rõ số nhà?',
    a: 'Bạn có thể sử dụng nút "Lấy vị trí hiện tại" (GPS) hoặc lia bản đồ OpenStreetMap và nhấp trực tiếp vào điểm xảy ra sự cố. Hệ thống sẽ tự động tìm tên đường và điền tọa độ chính xác cho bạn.',
  },
  {
    q: 'Tôi có thể gửi phản ánh ẩn danh không?',
    a: 'Có. Bạn chỉ cần cung cấp số điện thoại để nhận thông báo tiến độ qua tin nhắn Zalo/SMS. Mục họ tên người gửi là không bắt buộc.',
  },
  {
    q: 'Khi nào tôi có thể đánh giá mức độ hài lòng về kết quả xử lý?',
    a: 'Sau khi đội kỹ thuật hoàn tất thi công và tải lên ảnh nghiệm thu (After), hồ sơ sẽ hiển thị nút "Đánh giá mức độ hài lòng (5 sao)" tại trang Phản Ánh để bạn trực tiếp chấm điểm phục vụ.',
  },
];

export const CitizenHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedback('');
      setFeedbackSent(false);
      alert('Cảm ơn ý kiến đóng góp của bạn! UBND Phường Trấn Biên đã ghi nhận phản hồi.');
    }, 1000);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung Tâm Hỗ Trợ & Hướng Dẫn
            </h1>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider border border-blue-200">
              Trợ Giúp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quy trình giải quyết phản ánh hiện trường, giải đáp thắc mắc và danh bạ hỗ trợ 24/7
          </p>
        </div>

        <button
          onClick={() => navigate('/citizen/submit')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black px-5 py-3 rounded-none shadow-sm transition shrink-0 active:scale-[0.99] text-xs sm:text-sm border border-blue-900 uppercase tracking-wider"
        >
          <Camera className="w-4 h-4 text-white shrink-0" />
          <span>+ Gửi phản ánh ngay</span>
        </button>
      </div>

      {/* 2. QUY TRÌNH 4 BƯỚC MINH BẠCH */}
      <div className="bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Quy trình giải quyết phản ánh hiện trường 04 bước
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-none border border-slate-200 border-t-2 border-t-blue-600 bg-slate-50/50 space-y-2">
            <div className="w-9 h-9 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200">
              01
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Người dân gửi phản ánh</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chụp ảnh hiện trường thật, chọn vị trí trên OpenStreetMap và nhập số điện thoại nhận kết quả.
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-200 border-t-2 border-t-indigo-600 bg-slate-50/50 space-y-2">
            <div className="w-9 h-9 rounded-none bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200">
              02
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Tiếp nhận & phân công</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              UBND Phường thẩm định trong 2h, chuyển giao cho đội tiếp ứng chuyên môn xử lý tại chỗ.
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-200 border-t-2 border-t-amber-500 bg-slate-50/50 space-y-2">
            <div className="w-9 h-9 rounded-none bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm border border-amber-200">
              03
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Khắc phục tại hiện trường</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Đơn vị thi công sửa chữa trong 24h - 48h (SLA), chụp ảnh nghiệm thu Before - After nộp hệ thống.
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-200 border-t-2 border-t-emerald-600 bg-slate-50/50 space-y-2">
            <div className="w-9 h-9 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
              04
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Nghiệm thu & Đánh giá</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Người dân xem ảnh hoàn tất thực tế và trực tiếp chấm điểm mức độ hài lòng về chất lượng phục vụ.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CÂU HỎI THƯỜNG GẶP & ĐƯỜNG DÂY NÓNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): FAQ */}
        <div className="lg:col-span-7 bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 min-w-0">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Câu hỏi thường gặp của công dân (FAQ)</span>
          </h2>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-none border border-slate-200 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-3.5 sm:p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <span className="leading-snug">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-3.5 sm:p-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200 bg-slate-50/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI (5/12): ĐƯỜNG DÂY NÓNG & FORM GÓP Ý */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          <div className="bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Đường dây nóng hỗ trợ 24/7</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Tổng đài dịch vụ công tỉnh</div>
                  <div className="text-[11px] text-slate-500 truncate">Tiếp nhận phản ánh đô thị</div>
                </div>
                <a href="tel:1022" className="font-mono font-black text-blue-700 text-sm hover:underline whitespace-nowrap shrink-0">
                  1022
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Trực ban Công an Phường</div>
                  <div className="text-[11px] text-slate-500 truncate">An ninh trật tự & Giao thông</div>
                </div>
                <a href="tel:02513822113" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                  (0251) 3822.113
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Sự cố Điện lực Biên Hòa</div>
                  <div className="text-[11px] text-slate-500 truncate">Đứt cáp, chập điện, mất điện</div>
                </div>
                <a href="tel:19001006" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                  1900.1006
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">Cấp nước & Thoát nước</div>
                  <div className="text-[11px] text-slate-500 truncate">Vỡ đường ống nước, ngập sâu</div>
                </div>
                <a href="tel:02513822555" className="font-mono font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0">
                  (0251) 3822.555
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Gửi câu hỏi / Góp ý cho UBND Phường</span>
            </h3>

            <form onSubmit={handleSendFeedback} className="space-y-3">
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Bạn có thắc mắc hoặc góp ý gì để cải thiện ứng dụng..."
                className="w-full p-3 border border-slate-300 rounded-none text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={feedbackSent}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm border border-blue-900"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>{feedbackSent ? 'Đang gửi...' : 'Gửi ý kiến đóng góp'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

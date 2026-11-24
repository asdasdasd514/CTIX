import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Phone,
  ShieldCheck,
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
    a: 'Hoàn toàn được! Bạn có thể nhấn nút "Tải ảnh từ máy tính / Chụp ảnh" để tải file ảnh thực tế từ thiết bị của mình. Hệ thống còn có trợ lý AI tự động nhận diện hình ảnh để gợi ý đúng loại sự cố.',
  },
  {
    q: 'Làm thế nào để chọn vị trí sự cố khi tôi không nhớ rõ số nhà?',
    a: 'Bạn có thể sử dụng nút "Lấy vị trí của tôi" (GPS) hoặc lia bản đồ OpenStreetMap và nhấp trực tiếp vào điểm xảy ra sự cố. Hệ thống sẽ tự động tìm tên đường và điền tọa độ chính xác cho bạn.',
  },
  {
    q: 'Tôi có thể gửi phản ánh ẩn danh không?',
    a: 'Có. Bạn chỉ cần cung cấp số điện thoại để nhận thông báo tiến độ qua tin nhắn Zalo/SMS. Mục họ tên người gửi là không bắt buộc.',
  },
  {
    q: 'Khi nào tôi có thể đánh giá mức độ hài lòng về kết quả xử lý?',
    a: 'Sau khi đội kỹ thuật hoàn tất thi công và tải lên ảnh nghiệm thu (After), hồ sơ sẽ hiển thị nút "Đánh giá mức độ hài lòng 5 sao" tại trang Phản Ánh Của Tôi để bạn trực tiếp chấm điểm phục vụ của cán bộ.',
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
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER (GÓC VUÔNG) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trung Tâm Hỗ Trợ & Hướng Dẫn Sử Dụng
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider border border-blue-200">
              Trợ Giúp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quy trình giải quyết phản ánh hiện trường, giải đáp thắc mắc và danh bạ hỗ trợ 24/7
          </p>
        </div>

        <button
          onClick={() => navigate('/citizen/submit')}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black px-5 py-3 rounded-none shadow-sm transition shrink-0 active:scale-95 text-xs sm:text-sm border border-blue-900 uppercase tracking-wider"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>+ GỬI PHẢN ÁNH NGAY</span>
        </button>
      </div>

      {/* 2. QUY TRÌNH 4 BƯỚC MINH BẠCH (GÓC VUÔNG) */}
      <div className="bg-white rounded-none border border-slate-300 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Quy trình giải quyết phản ánh hiện trường 04 bước
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-none border border-slate-300 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-none bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200">
              01
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Người dân gửi phản ánh</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chụp ảnh hiện trường thật, chọn vị trí trên OpenStreetMap và nhập số điện thoại nhận kết quả.
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-300 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-none bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200">
              02
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Cán bộ tiếp nhận & phân công</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              UBND Phường thẩm định trong 2h, chuyển giao cho đội tiếp ứng chuyên môn (CSGT, Quản lý đô thị).
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-300 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-none bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm border border-amber-200">
              03
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Khắc phục tại hiện trường</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đơn vị thi công sửa chữa trong 24h - 48h (SLA), chụp ảnh nghiệm thu Before - After nộp hệ thống.
            </p>
          </div>

          <div className="p-4 rounded-none border border-slate-300 bg-slate-50/50 space-y-2">
            <div className="w-10 h-10 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
              04
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Nghiệm thu & Đánh giá 5 sao</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Người dân xem ảnh hoàn tất thực tế và trực tiếp chấm điểm mức độ hài lòng về chất lượng phục vụ.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CÂU HỎI THƯỜNG GẶP (FAQS) & FORM GÓP Ý (GÓC VUÔNG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7/12 CỘT): CÂU HỎI THƯỜNG GẶP */}
        <div className="lg:col-span-7 bg-white rounded-none border border-slate-300 shadow-2xs p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>Câu hỏi thường gặp của công dân (FAQ)</span>
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-none border border-slate-300 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI (5/12 CỘT): DANH BẠ ĐƯỜNG DÂY NÓNG & FORM GÓP Ý (GÓC VUÔNG) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Danh bạ khẩn cấp */}
          <div className="bg-white rounded-none border border-slate-300 shadow-2xs p-5 space-y-3">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-600" />
              <span>Đường dây nóng hỗ trợ khẩn cấp 24/7</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Tổng đài dịch vụ công tỉnh</div>
                  <div className="text-[11px] text-slate-500">Tiếp nhận phản ánh đô thị</div>
                </div>
                <a href="tel:1022" className="font-mono font-black text-blue-700 text-sm hover:underline">
                  1022
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Trực ban Công an Phường</div>
                  <div className="text-[11px] text-slate-500">An ninh trật tự & Giao thông</div>
                </div>
                <a href="tel:02513822113" className="font-mono font-bold text-blue-700 hover:underline">
                  (0251) 3822.113
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Sự cố Điện lực Biên Hòa</div>
                  <div className="text-[11px] text-slate-500">Đứt cáp, chập điện, mất điện</div>
                </div>
                <a href="tel:19001006" className="font-mono font-bold text-blue-700 hover:underline">
                  1900.1006
                </a>
              </div>

              <div className="p-3 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Cấp nước & Thoát nước ngập úng</div>
                  <div className="text-[11px] text-slate-500">Vỡ đường ống nước, ngập sâu</div>
                </div>
                <a href="tel:02513822555" className="font-mono font-bold text-blue-700 hover:underline">
                  (0251) 3822.555
                </a>
              </div>
            </div>
          </div>

          {/* Form góp ý trực tiếp (GÓC VUÔNG) */}
          <div className="bg-white rounded-none border border-slate-300 shadow-2xs p-5 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
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
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs border border-blue-900"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{feedbackSent ? 'Đang gửi...' : 'Gửi ý kiến đóng góp'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

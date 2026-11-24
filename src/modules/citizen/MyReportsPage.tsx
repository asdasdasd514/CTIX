import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types/incident';
import { CitizenRatingModal } from './CitizenRatingModal';
import {
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  ChevronRight,
  PlusCircle,
  Search,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);
  const [ratingTarget, setRatingTarget] = useState<Incident | null>(null);

  const filteredList = incidents.filter((item) => {
    if (statusFilter === 'pending') {
      if (item.status === 'resolved' || item.status === 'closed') return false;
    }
    if (statusFilter === 'resolved') {
      if (item.status !== 'resolved' && item.status !== 'closed') return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchAddress = item.location.address.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchAddress) return false;
    }
    return true;
  });

  const handleSelectIncident = (item: Incident) => {
    setSelectedIncident(item);
    // Trên điện thoại/tablet (< 1024px), tự cuộn mượt xuống phần chi tiết để người dùng thấy ngay
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-[5px] bg-amber-500 animate-pulse" />
            Chờ tiếp nhận
          </span>
        );
      case 'assigned':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-blue-300 whitespace-nowrap">
            Đã giao đơn vị
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-indigo-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-[5px] bg-indigo-500 animate-pulse" />
            Đang khắc phục
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã hoàn thành
          </span>
        );
      case 'closed':
        return (
          <span className="bg-slate-100 text-slate-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-slate-300 whitespace-nowrap">
            Đã nghiệm thu
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. THANH TIÊU ĐỀ & NÚT "+ THÊM PHẢN ÁNH" (KHÔNG BANNER, GÓC VUÔNG, CÂN ĐỐI PC & MOBILE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh Sách Phản Ánh Hiện Trường
            </h1>
            <span className="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-[5px] uppercase tracking-wider border border-blue-200">
              Công Dân
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Theo dõi tiến độ xử lý công khai và đánh giá chất lượng phục vụ
          </p>
        </div>

        <button
          onClick={() => navigate('/citizen/submit')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black px-5 py-3 rounded-[5px] shadow-sm transition active:scale-[0.99] text-xs sm:text-sm uppercase tracking-wider border border-blue-900 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white shrink-0" />
          <span>+ Thêm phản ánh</span>
        </button>
      </div>

      {/* 2. THANH CÔNG CỤ: BỘ LỌC & TÌM KIẾM (CHỐNG TRÀN TRÊN MOBILE) */}
      <div className="bg-white p-3 sm:p-4 rounded-[5px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Bộ lọc trạng thái */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-200 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({incidents.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang xử lý
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
              statusFilter === 'resolved'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hoàn thành
          </button>
        </div>

        {/* Ô Tìm Kiếm Nhanh */}
        <div className="relative w-full md:max-w-sm min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã PA-001, tên đường, loại sự cố..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-[5px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. BỐ CỤC CHÍNH 2 CỘT (PC: 7/5 | MOBILE: XẾP DỌC GỌN GÀNG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7 / 12 CỘT): DANH SÁCH THẺ HỒ SƠ */}
        <div className="lg:col-span-7 space-y-3 min-w-0">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-[5px] border border-slate-200 p-10 text-center text-slate-400 text-xs">
              Không tìm thấy phản ánh nào phù hợp với bộ lọc
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedIncident?.id === item.id;
              const isResolved = item.status === 'resolved' || item.status === 'closed';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectIncident(item)}
                  className={`bg-white rounded-[5px] border p-3.5 sm:p-5 transition cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/20 ring-1 ring-blue-700'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/40'
                  }`}
                >
                  {/* Header thẻ: flex-wrap chống tràn trên mobile */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                        {item.code}
                      </span>
                      {getStatusBadge(item.status)}
                      {item.sameReportsCount > 1 && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-[5px] border border-rose-200 whitespace-nowrap">
                          🔥 {item.sameReportsCount} người báo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Nội dung thẻ */}
                  <div className="flex items-start gap-3 sm:gap-4 mt-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[5px] overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img
                        src={item.photosBefore[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="text-xs text-slate-600 flex items-center gap-1 mt-2 font-medium min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{item.location.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Thẻ */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {isResolved ? 'Đã nghiệm thu xong' : 'Hạn SLA: Còn 22 giờ'}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 text-blue-700 font-bold text-xs whitespace-nowrap">
                      <span>{isSelected ? 'Đang xem' : 'Xem chi tiết'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI (5 / 12 CỘT): PANEL CHI TIẾT & ĐÁNH GIÁ 5 SAO */}
        <div ref={detailPanelRef} className="lg:col-span-5 lg:sticky lg:top-24 space-y-4 min-w-0 scroll-mt-24">
          {selectedIncident ? (
            <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-6 space-y-5">
              {/* Header Hồ Sơ */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                    {selectedIncident.code}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1.5 leading-snug break-words">
                    {selectedIncident.title}
                  </h2>
                </div>
                <div className="shrink-0">{getStatusBadge(selectedIncident.status)}</div>
              </div>

              {/* So sánh ảnh Trước - Sau (Before & After) */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
                  Hình ảnh xác minh hiện trường:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-rose-700 block truncate">
                      ● Lúc báo cáo:
                    </span>
                    <div className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={selectedIncident.photosBefore[0]}
                        alt="Trước"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 block truncate">
                      ● Sau hoàn tất:
                    </span>
                    <div className="aspect-video rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {selectedIncident.photosAfter && selectedIncident.photosAfter[0] ? (
                        <img
                          src={selectedIncident.photosAfter[0]}
                          alt="Sau"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 text-[11px]">
                          <Clock className="w-4 h-4 mx-auto mb-1 text-slate-300" />
                          <span>Đang thi công</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Tiến Trình 4 Bước */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-[5px] border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-800 uppercase block">
                  Tiến trình giải quyết của UBND Phường:
                </span>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">1. Đã tiếp nhận phản ánh</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(selectedIncident.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.assignedTo
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {selectedIncident.assignedTo ? '✓' : '2'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">2. Cán bộ phân công xử lý</div>
                      <div className="text-[11px] text-slate-500 break-words">
                        {selectedIncident.assignedTo
                          ? `Giao cho: ${selectedIncident.assignedTo.unitName}`
                          : 'Đang xếp lịch kiểm tra'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.status === 'resolved' || selectedIncident.status === 'closed'
                          ? 'bg-emerald-600 text-white'
                          : selectedIncident.status === 'in_progress'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-300 text-slate-600'
                        }`}
                    >
                      {selectedIncident.status === 'resolved' || selectedIncident.status === 'closed'
                        ? '✓'
                        : '3'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">3. Đội kỹ thuật khắc phục hiện trường</div>
                      <div className="text-[11px] text-slate-500">
                        {selectedIncident.status === 'resolved' || selectedIncident.status === 'closed'
                          ? 'Đã thi công xong và nộp ảnh nghiệm thu'
                          : 'Đang triển khai theo thời hạn SLA'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-[5px] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        selectedIncident.rating
                          ? 'bg-emerald-600 text-white'
                          : selectedIncident.status === 'resolved'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-300 text-slate-600'
                        }`}
                    >
                      {selectedIncident.rating ? '✓' : '4'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">4. Đánh giá hài lòng của người dân</div>
                      <div className="text-[11px] text-slate-500">
                        {selectedIncident.rating
                          ? `Đã đánh giá: ${selectedIncident.rating.stars} sao ★`
                          : 'Chờ người dân chấm điểm chất lượng'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút đánh giá 5 sao */}
              {(selectedIncident.status === 'resolved' || selectedIncident.status === 'closed') && (
                <div className="pt-1">
                  {selectedIncident.rating ? (
                    <div className="bg-amber-50 border border-amber-300 p-4 rounded-[5px] text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-amber-500">
                        {Array.from({ length: selectedIncident.rating.stars }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="font-bold text-xs text-amber-900">
                        Bạn đã đánh giá {selectedIncident.rating.stars}/5 sao
                      </div>
                      {selectedIncident.rating.comment && (
                        <p className="text-xs text-amber-800 italic break-words">
                          "{selectedIncident.rating.comment}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setRatingTarget(selectedIncident)}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-[5px] font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.99] text-xs sm:text-sm border border-amber-600 uppercase tracking-wide"
                    >
                      <Star className="w-4 h-4 fill-slate-900 shrink-0" />
                      <span>Đánh giá mức độ hài lòng (5 sao)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[5px] border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Chọn một phản ánh để xem tiến độ chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal Chấm Điểm Hài Lòng */}
      {ratingTarget && (
        <CitizenRatingModal
          incident={ratingTarget}
          onClose={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
};

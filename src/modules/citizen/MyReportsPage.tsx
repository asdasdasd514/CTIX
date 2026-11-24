import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident, IncidentCategory } from '../../types/incident';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Search,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  AlertCircle,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const CATEGORY_FILTERS: {
  id: 'all' | IncidentCategory;
  label: string;
  icon?: React.ElementType;
  activeClass: string;
}[] = [
  { id: 'all', label: 'Tất cả loại', activeClass: 'bg-slate-800 text-white border-slate-900' },
  { id: 'street_light', label: 'Đèn đường', icon: Lightbulb, activeClass: 'bg-amber-500 text-white border-amber-600' },
  { id: 'flooding', label: 'Ngập úng', icon: Waves, activeClass: 'bg-blue-600 text-white border-blue-700' },
  { id: 'waste', label: 'Rác thải', icon: Trash2, activeClass: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 'road_damage', label: 'Ổ gà', icon: Construction, activeClass: 'bg-rose-600 text-white border-rose-700' },
  { id: 'other', label: 'Khác', icon: AlertCircle, activeClass: 'bg-violet-600 text-white border-violet-700' },
];

function getCategoryBadge(category: IncidentCategory) {
  switch (category) {
    case 'street_light':
      return (
        <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
          <Lightbulb className="w-3 h-3 text-amber-600" />
          Đèn đường
        </span>
      );
    case 'flooding':
      return (
        <span className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-blue-200 inline-flex items-center gap-1 whitespace-nowrap">
          <Waves className="w-3 h-3 text-blue-600" />
          Ngập úng
        </span>
      );
    case 'waste':
      return (
        <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
          <Trash2 className="w-3 h-3 text-emerald-600" />
          Rác thải
        </span>
      );
    case 'road_damage':
      return (
        <span className="bg-rose-50 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap">
          <Construction className="w-3 h-3 text-rose-600" />
          Ổ gà
        </span>
      );
    case 'other':
      return (
        <span className="bg-violet-50 text-violet-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-violet-200 inline-flex items-center gap-1 whitespace-nowrap">
          <AlertCircle className="w-3 h-3 text-violet-600" />
          Khác
        </span>
      );
  }
}

export const MyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | IncidentCategory>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Tự động về trang 1 khi thay đổi bộ lọc hoặc từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchTerm]);

  const filteredList = incidents.filter((item) => {
    if (statusFilter === 'pending') {
      if (item.status === 'resolved' || item.status === 'closed') return false;
    }
    if (statusFilter === 'resolved') {
      if (item.status !== 'resolved' && item.status !== 'closed') return false;
    }
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    // Tìm kiếm theo tiêu đề, mô tả, địa chỉ (không tìm theo ID)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchAddress = item.location.address.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddress) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tạo danh sách số trang hiển thị gọn gàng
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const getStatusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
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
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
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
      {/* 1. THANH TIÊU ĐỀ & NÚT "+ THÊM PHẢN ÁNH" */}
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
            Bấm vào từng phản ánh để mở trang xem chi tiết tiến độ xử lý và đánh giá
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

      {/* 2. THANH CÔNG CỤ: LỌC TRẠNG THÁI, LỌC LOẠI SỰ CỐ & TÌM KIẾM (KHÔNG TÌM THEO ID) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-slate-200 shadow-sm space-y-3">
        {/* Hàng 1: Trạng thái + Tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-200 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[4px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({incidents.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[4px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[4px] text-[11px] sm:text-xs font-bold transition text-center whitespace-nowrap ${
                statusFilter === 'resolved'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoàn thành
            </button>
          </div>

          <div className="relative w-full md:max-w-sm min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên đường, địa chỉ, nội dung sự cố..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-[5px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Hàng 2: Bộ lọc theo loại sự cố (Đèn đường, Ngập úng, Rác thải, Ổ gà, Khác) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Loại sự cố:</span>
          {CATEGORY_FILTERS.map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-[5px] text-[11px] sm:text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                  isActive
                    ? cat.activeClass
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DANH SÁCH PHẢN ÁNH (KHÔNG HIỂN THỊ ID, PHÂN TRANG GỌN GÀNG) */}
      {paginatedList.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
          Không tìm thấy phản ánh nào phù hợp với bộ lọc
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedList.map((item) => {
              const isResolved = item.status === 'resolved' || item.status === 'closed';

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/citizen/reports/${item.id}`)}
                  className="bg-white rounded-[5px] border border-slate-200 hover:border-blue-600 hover:shadow-md p-4 sm:p-5 transition cursor-pointer shadow-sm flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-3">
                    {/* Header thẻ: Loại sự cố + Trạng thái (không hiển thị ID) */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {getCategoryBadge(item.category)}
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
                    <div className="flex items-start gap-3.5">
                      <div className="w-20 h-20 rounded-[5px] overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={item.photosBefore[0]}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
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
                  </div>

                  {/* Footer Thẻ */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {isResolved ? 'Đã nghiệm thu xong' : 'Hạn SLA: Còn 22 giờ'}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 text-blue-700 font-bold text-xs whitespace-nowrap group-hover:translate-x-0.5 transition">
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. THANH CHUYỂN TRANG (PHÂN TRANG Ở GÓC PHẢI) */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị{' '}
              <strong className="text-slate-800">
                {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filteredList.length)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{filteredList.length}</strong> phản ánh
            </div>

            <div className="flex items-center justify-end gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="px-2.5 py-1.5 rounded-[5px] border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {getPageNumbers().map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 text-xs text-slate-400 font-bold">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-[5px] border text-xs font-bold transition ${
                      p === safePage
                        ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="px-2.5 py-1.5 rounded-[5px] border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

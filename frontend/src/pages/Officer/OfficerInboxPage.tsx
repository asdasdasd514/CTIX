import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Incident, IncidentCategory, IncidentPriority } from '../../types/incident';
import { isOverdue, PRIORITY_LABELS, STATUS_LABELS } from '../../lib/incidents';
import {
  Search,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  AlertCircle,
  Send,
  Eye,
  Inbox,
  Truck,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const ITEMS_PER_PAGE = 8;

const CATEGORY_OPTIONS: {
  id: IncidentCategory;
  label: string;
  icon: React.ElementType;
  activeClass: string;
}[] = [
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

export const OfficerInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, approveIncident, rejectIncident } = useIncidentStore();
  const { currentUser } = useAuthStore();

  const reviewCount = incidents.filter((i) => i.status === 'pending_review').length;
  const rejectedCount = incidents.filter((i) => i.status === 'rejected').length;

  const [statusTab, setStatusTab] = useState<
    'pending_review' | 'pending' | 'open' | 'all' | 'overdue' | 'resolved' | 'rejected'
  >(() => (incidents.some((i) => i.status === 'pending_review') ? 'pending_review' : 'pending'));
  const [selectedCategories, setSelectedCategories] = useState<IncidentCategory[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<'all' | IncidentPriority>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const now = Date.now();
  const pendingCount = incidents.filter((i) => i.status === 'pending').length;
  const assignedCount = incidents.filter((i) => i.status === 'assigned').length;
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress').length;
  const overdueCount = incidents.filter((i) => isOverdue(i, now)).length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

  const toggleCategory = (cat: IncidentCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, selectedCategories, priorityFilter, searchTerm]);

  const filteredList = incidents
    .filter((item) => {
      if (statusTab === 'pending_review' && item.status !== 'pending_review') return false;
      if (statusTab === 'pending' && item.status !== 'pending') return false;
      if (
        statusTab === 'open' &&
        (item.status === 'resolved' ||
          item.status === 'closed' ||
          item.status === 'pending_review' ||
          item.status === 'rejected')
      )
        return false;
      if (statusTab === 'overdue' && !isOverdue(item, now)) return false;
      if (statusTab === 'resolved' && item.status !== 'resolved' && item.status !== 'closed') return false;
      if (statusTab === 'rejected' && item.status !== 'rejected') return false;

      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchAddress = item.location.address.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchAddress && !matchDesc) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aOver = isOverdue(a, now) ? 1 : 0;
      const bOver = isOverdue(b, now) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      const prioOrder: Record<IncidentPriority, number> = { urgent: 3, high: 2, normal: 1 };
      if (prioOrder[a.priority] !== prioOrder[b.priority]) {
        return prioOrder[b.priority] - prioOrder[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const getStatusBadge = (item: Incident) => {
    if (isOverdue(item, now)) {
      return (
        <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-rose-300 inline-flex items-center gap-1 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3" />
          Quá hạn SLA
        </span>
      );
    }
    switch (item.status) {
      case 'pending_review':
        return (
          <span className="bg-violet-100 text-violet-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-violet-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
            Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-rose-50 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            Từ chối
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-amber-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ phân công
          </span>
        );
      case 'assigned':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-blue-300 whitespace-nowrap">
            Đã giao xử lý
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-indigo-300 inline-flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Đang xử lý
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-[5px] border border-emerald-300 inline-flex items-center gap-1 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {STATUS_LABELS[item.status]}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. THẺ TỔNG QUAN NHANH (BẤM ĐỂ LỌC NHANH) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusTab('pending_review')}
          className={`p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'pending_review'
              ? 'border-violet-600 ring-1 ring-violet-600 bg-violet-50/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Chờ duyệt</span>
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-black text-violet-700 mt-1">{reviewCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('pending')}
          className={`p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'pending'
              ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Chờ phân công</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('open')}
          className={`p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'open'
              ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Đã giao / Đang xử lý</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 mt-1">{assignedCount + inProgressCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('overdue')}
          className={`p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'overdue'
              ? 'border-rose-600 ring-1 ring-rose-600 bg-rose-50/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Quá hạn SLA</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{overdueCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('resolved')}
          className={`p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'resolved'
              ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/40'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusTab('all')}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-[5px] border text-left transition shadow-sm bg-white ${
            statusTab === 'all'
              ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Tất cả hồ sơ</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{incidents.length}</div>
        </button>
      </div>

      {/* 2. THANH BỘ LỌC ĐẸP ĐỒNG NHẤT TRANG CÔNG DÂN */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[5px] border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tab trạng thái */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-200">
            {[
              { id: 'pending_review', label: `Chờ duyệt (${reviewCount})` },
              { id: 'pending', label: `Chờ phân công (${pendingCount})` },
              { id: 'open', label: 'Chưa hoàn tất' },
              { id: 'overdue', label: `Quá hạn (${overdueCount})` },
              { id: 'resolved', label: 'Đã xử lý' },
              { id: 'rejected', label: `Từ chối (${rejectedCount})` },
              { id: 'all', label: `Tất cả (${incidents.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatusTab(t.id as typeof statusTab)}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition whitespace-nowrap ${
                  statusTab === t.id
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm + lọc mức độ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã hồ sơ, tên đường, sự cố..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-[5px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | IncidentPriority)}
              className="px-3 py-2 border border-slate-300 rounded-[5px] text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Ưu tiên cao</option>
              <option value="normal">Bình thường</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Chọn nhiều loại sự cố giống trang công dân */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">
            Loại sự cố <span className="normal-case font-medium text-slate-400">(chọn nhiều):</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={`px-2.5 py-1.5 rounded-[5px] text-xs font-bold border transition ${
              selectedCategories.length === 0
                ? 'bg-slate-800 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            Tất cả loại
          </button>

          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-[5px] text-xs font-bold border transition inline-flex items-center gap-1.5 ${
                  isSelected
                    ? cat.activeClass
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.label}</span>
                {isSelected && <span className="text-[10px] font-black">✓</span>}
              </button>
            );
          })}

          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className="ml-auto text-[11px] font-bold text-rose-600 hover:underline px-2 py-1"
            >
              Bỏ chọn ({selectedCategories.length})
            </button>
          )}
        </div>
      </div>

      {/* 3. DANH SÁCH HỒ SƠ (BẤM VÀO CHUYỂN TRANG PHÂN CÔNG RIÊNG /dispatch/:id) */}
      {paginatedList.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
          Không tìm thấy hồ sơ phản ánh nào phù hợp với bộ lọc hiện tại
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedList.map((item) => {
              const canDispatch = item.status === 'pending';

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/admin/dispatch/${item.id}`)}
                  className="bg-white rounded-[5px] border border-slate-200 hover:border-blue-600 hover:shadow-md p-4 sm:p-5 transition cursor-pointer shadow-sm flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-[5px] border border-blue-200">
                          {item.code}
                        </span>
                        {getCategoryBadge(item.category)}
                        {getStatusBadge(item)}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-[5px] ${
                          item.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.priority === 'high'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                    </div>

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

                  {/* Footer: Chờ duyệt (Duyệt/Từ chối) | Chờ phân công (Giao việc) | Đã giao (Xem) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-500 font-medium truncate">
                      {item.status === 'pending_review' ? (
                        <span className="text-violet-700 font-semibold">
                          Mới gửi • Chờ kiểm duyệt tiếp nhận
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="text-rose-700 font-semibold">
                          Lý do: {item.review?.reason || 'Không đủ điều kiện tiếp nhận'}
                        </span>
                      ) : item.assignedTo ? (
                        <span className="text-slate-700 font-semibold">
                          Đơn vị: {item.assignedTo.unitName}
                          {item.assignedTo.assigneeName ? ` • ${item.assignedTo.assigneeName}` : ''}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Chưa phân công nhân lực</span>
                      )}
                    </div>

                    {item.status === 'pending_review' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const reason = window.prompt(
                              `Nhập lý do từ chối tiếp nhận hồ sơ ${item.code}:`,
                              'Ảnh không rõ hiện trường hoặc ngoài phạm vi Phường Trấn Biên'
                            );
                            if (reason && reason.trim()) {
                              rejectIncident(item.id, reason.trim(), currentUser.name);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            approveIncident(item.id, currentUser.name);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt tiếp nhận</span>
                        </button>
                      </div>
                    ) : canDispatch ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-blue-700 group-hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition whitespace-nowrap">
                        <Send className="w-3.5 h-3.5" />
                        <span>Phân công ngay</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-xs whitespace-nowrap">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. THANH CHUYỂN TRANG GÓC DƯỚI BÊN PHẢI */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị{' '}
              <strong className="text-slate-800">
                {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filteredList.length)}
              </strong>{' '}
              trên tổng số <strong className="text-slate-800">{filteredList.length}</strong> hồ sơ
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types/incident';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  PlusCircle,
  Search,
} from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
      {/* 1. THANH TIÊU ĐỀ & NÚT "+ THÊM PHẢN ÁNH" (KHÔNG BANNER) */}
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

      {/* 2. THANH CÔNG CỤ: BỘ LỌC & TÌM KIẾM */}
      <div className="bg-white p-3 sm:p-4 rounded-[5px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
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
            placeholder="Tìm mã PA-001, tên đường, loại sự cố..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-[5px] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 3. DANH SÁCH PHẢN ÁNH TOÀN MÀN HÌNH (BẤM VÀO SẼ CHUYỂN SANG TRANG CHI TIẾT RIÊNG) */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-12 text-center text-slate-400 text-xs sm:text-sm">
          Không tìm thấy phản ánh nào phù hợp với bộ lọc
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const isResolved = item.status === 'resolved' || item.status === 'closed';

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/citizen/reports/${item.id}`)}
                className="bg-white rounded-[5px] border border-slate-200 hover:border-blue-600 hover:shadow-md p-4 sm:p-5 transition cursor-pointer shadow-sm flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-3">
                  {/* Header thẻ */}
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
      )}
    </div>
  );
};

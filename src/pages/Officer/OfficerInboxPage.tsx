import React, { useState } from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useNavigate } from 'react-router-dom';
import { IncidentCategory } from '../../types/incident';
import {
  Search,
  Download,
  MapPin,
  Send,
  ExternalLink,
} from 'lucide-react';

export const OfficerInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, searchQuery, setSearchQuery } = useIncidentStore();

  const [filterTag, setFilterTag] = useState<'all' | 'urgent' | 'pending' | 'in_progress'>('all');
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | 'all'>('all');

  const urgentCount = incidents.filter(
    (i) => i.priority === 'urgent' && i.status !== 'resolved' && i.status !== 'closed'
  ).length;
  const pendingCount = incidents.filter((i) => i.status === 'pending').length;
  const inProgressCount = incidents.filter((i) => i.status === 'assigned' || i.status === 'in_progress').length;

  const filteredIncidents = incidents.filter((item) => {
    if (filterTag === 'urgent' && item.priority !== 'urgent') return false;
    if (filterTag === 'pending' && item.status !== 'pending') return false;
    if (filterTag === 'in_progress' && item.status !== 'assigned' && item.status !== 'in_progress') return false;

    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.location.address.toLowerCase().includes(q) ||
        item.sender.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Tiêu đề trang & Thống kê huy hiệu (Chuẩn Màn 2 trong ảnh) */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Desktop Cán Bộ • Màn 04
            </span>
            <span className="text-xs text-slate-400">UBND Phường Trấn Biên</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Hồ Sơ Chờ Điều Phối Xử Lý
            </h2>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {pendingCount} Hồ sơ mới cần phân công
            </span>
          </div>
        </div>

        {/* 3 Badges trạng thái bên phải header (Màu sắc Pastel thanh lịch) */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            Khẩn cấp: 03 vụ
          </span>
          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg">
            Quá hạn: 01 vụ
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg">
            Đúng hạn: 98,4%
          </span>
        </div>
      </div>

      {/* Thanh Công Cụ Tìm Kiếm & Bộ Lọc Nhanh */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Ô Tìm Kiếm Lớn */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mã phản ánh (PA-001...), địa chỉ, số điện thoại công dân..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white font-medium transition"
          />
        </div>

        {/* Dropdown Lĩnh Vực & Xuất File */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="all">Lĩnh vực: Tất cả</option>
            <option value="street_light">Đèn chiếu sáng</option>
            <option value="flooding">Ngập nước & Cống</option>
            <option value="waste">Vệ sinh môi trường</option>
            <option value="road_damage">Giao thông - Mặt đường</option>
          </select>

          <button
            onClick={() => alert('Đã xuất danh sách báo cáo Excel gửi lãnh đạo UBND Phường Trấn Biên!')}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* Các Tag Lọc Nhanh (Pills) */}
      <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setFilterTag('all')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            filterTag === 'all'
              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tất cả ({incidents.length})
        </button>
        <button
          onClick={() => setFilterTag('urgent')}
          className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${
            filterTag === 'urgent'
              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
          }`}
        >
          <span>🔥 Khẩn cấp ({urgentCount})</span>
        </button>
        <button
          onClick={() => setFilterTag('pending')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            filterTag === 'pending'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
          }`}
        >
          Chưa phân công ({pendingCount})
        </button>
        <button
          onClick={() => setFilterTag('in_progress')}
          className={`px-3 py-1.5 rounded-lg border transition ${
            filterTag === 'in_progress'
              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
              : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
          }`}
        >
          Đang xử lý ({inProgressCount})
        </button>
      </div>

      {/* Bảng Dữ Liệu Desktop Cán Bộ (Màn 2 trong ảnh mẫu) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">MÃ PHẢN ÁNH</th>
                <th className="py-3.5 px-4 font-bold">THỜI GIAN GỬI</th>
                <th className="py-3.5 px-4 font-bold min-w-[280px]">SỰ CỐ & ẢNH HIỆN TRƯỜNG</th>
                <th className="py-3.5 px-4 font-bold min-w-[190px]">VỊ TRÍ HIỆN TRƯỜNG</th>
                <th className="py-3.5 px-4 font-bold">MỨC ĐỘ</th>
                <th className="py-3.5 px-4 font-bold text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.slice(0, 20).map((item, idx) => {
                const isUrgent = item.priority === 'urgent';
                const isResolved = item.status === 'resolved' || item.status === 'closed';

                return (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition group">
                    {/* Cột 1: Mã phản ánh */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {item.code}
                    </td>

                    {/* Cột 2: Thời gian gửi */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="font-bold text-slate-800">
                        {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {idx === 0 ? '10 phút trước' : idx === 1 ? '45 phút trước' : 'Hôm qua'}
                      </div>
                    </td>

                    {/* Cột 3: Sự cố & Ảnh hiện trường */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-2xs">
                          <img
                            src={item.photosBefore[0]}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1 text-xs sm:text-sm">
                            {item.title}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Vị trí */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.location.address}</span>
                      </div>
                    </td>

                    {/* Cột 5: Mức độ */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isUrgent ? (
                        <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Khẩn cấp
                        </span>
                      ) : item.priority === 'high' ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                          Ưu tiên cao
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[11px]">
                          Bình thường
                        </span>
                      )}
                    </td>

                    {/* Cột 6: Thao tác (Điều hướng Web chuẩn: Bấm phân công chuyển thẳng sang /dispatch/:id) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.status === 'pending' ? (
                        <button
                          onClick={() => navigate(`/dispatch/${item.id}`)}
                          className="px-4 py-1.5 bg-[#0f3b7d] hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 mx-auto"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Phân công</span>
                        </button>
                      ) : isResolved ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          ✓ Đã hoàn tất
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/dispatch/${item.id}`)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition"
                        >
                          <span>{item.assignedTo?.unitName ? 'Đã giao việc' : 'Đang xử lý'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer phân trang nhẹ nhàng */}
        <div className="p-3 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <strong>20 / {incidents.length}</strong> hồ sơ phản ánh hiện trường
          </span>
          <div className="flex items-center gap-1 font-bold">
            <button className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">1</button>
            <button className="px-2.5 py-1 bg-blue-600 text-white rounded shadow-2xs">2</button>
            <button className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">3</button>
          </div>
        </div>
      </div>
    </div>
  );
};

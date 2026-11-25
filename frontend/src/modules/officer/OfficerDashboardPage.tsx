import React, { useState } from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident, IncidentCategory, IncidentStatus } from '../../types/incident';
import { DispatchModal } from './DispatchModal';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, Send, Filter, Search, Lightbulb, Waves, Trash2, Construction } from 'lucide-react';

export const OfficerDashboardPage: React.FC = () => {
  const { incidents, searchQuery, setSearchQuery } = useIncidentStore();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'all'>('all');
  const [dispatchTarget, setDispatchTarget] = useState<Incident | null>(null);

  // Thống kê chuẩn Phường Trấn Biên (tháng 11/2026)
  const total = incidents.length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const pendingCount = incidents.filter(i => i.status === 'pending').length;
  const inProgressCount = incidents.filter(i => i.status === 'assigned' || i.status === 'in_progress').length;

  const countLight = incidents.filter(i => i.category === 'street_light').length;
  const countFlood = incidents.filter(i => i.category === 'flooding').length;
  const countWaste = incidents.filter(i => i.category === 'waste').length;
  const countRoad = incidents.filter(i => i.category === 'road_damage').length;

  // Lọc danh sách phản ánh
  const filteredList = incidents.filter((item) => {
    if (activeTab === 'pending' && item.status !== 'pending') return false;
    if (activeTab === 'in_progress' && item.status !== 'assigned' && item.status !== 'in_progress') return false;
    if (activeTab === 'resolved' && item.status !== 'resolved' && item.status !== 'closed') return false;

    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.location.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner Thống kê chuẩn Phường Trấn Biên (tháng 11/2026) */}
      <div className="bg-gradient-to-r from-[#0f3b7d] to-[#1e3a8a] text-white p-4 sm:p-5 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-800/80 pb-3 mb-4">
          <div>
            <span className="text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded font-bold uppercase">
              Màn hình 4 • Bàn làm việc Cán bộ tiếp nhận
            </span>
            <h2 className="text-lg sm:text-xl font-bold mt-1">
              Trung Tâm Tiếp Nhận & Điều Phối Phản Ánh Hiện Trường
            </h2>
            <p className="text-xs sm:text-sm text-blue-200">
              Địa bàn: Phường Trấn Biên • Dữ liệu tháng 11/2026
            </p>
          </div>
          <div className="bg-white/10 px-3.5 py-2 rounded-lg border border-white/20 text-right">
            <span className="text-xs text-blue-200 block">Thời gian xử lý trung bình:</span>
            <span className="text-base sm:text-lg font-bold text-amber-300">⚡ 3,2 ngày</span>
          </div>
        </div>

        {/* 4 Thẻ KPI chính */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <span className="text-[11px] text-blue-200 block">Tổng phản ánh tháng:</span>
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[10px] text-blue-200 block mt-0.5">100% đã được số hóa</span>
          </div>
          <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-400/30">
            <span className="text-[11px] text-emerald-200 block">Đã xử lý hoàn thành:</span>
            <span className="text-2xl font-bold text-emerald-300">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-200 block mt-0.5">Tỷ lệ: {((resolvedCount / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-amber-500/20 p-3 rounded-lg border border-amber-400/30">
            <span className="text-[11px] text-amber-200 block">Chờ cán bộ tiếp nhận:</span>
            <span className="text-2xl font-bold text-amber-300">{pendingCount}</span>
            <span className="text-[10px] text-amber-200 block mt-0.5">Cần xử lý trong 2h</span>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-lg border border-blue-400/30">
            <span className="text-[11px] text-blue-200 block">Đang giao / xử lý:</span>
            <span className="text-2xl font-bold text-blue-300">{inProgressCount}</span>
            <span className="text-[10px] text-blue-200 block mt-0.5">Đúng tiến độ SLA</span>
          </div>
        </div>

        {/* Thống kê 4 loại sự cố đúng số liệu đề bài */}
        <div className="mt-3 pt-3 border-t border-blue-800/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-blue-200 font-semibold">Cơ cấu 64 phản ánh:</span>
          <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Đèn đường: <strong>{countLight}</strong>
          </span>
          <span className="bg-blue-400/20 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30 flex items-center gap-1">
            <Waves className="w-3 h-3" /> Ngập nước: <strong>{countFlood}</strong>
          </span>
          <span className="bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Rác thải: <strong>{countWaste}</strong>
          </span>
          <span className="bg-rose-400/20 text-rose-200 px-2 py-0.5 rounded border border-rose-400/30 flex items-center gap-1">
            <Construction className="w-3 h-3" /> Mặt đường (ổ gà): <strong>{countRoad}</strong>
          </span>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Tabs Trạng Thái */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Chờ giao việc ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'in_progress' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Đang xử lý ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${activeTab === 'resolved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Đã hoàn thành ({resolvedCount})
          </button>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative flex-1 sm:w-64 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên đường..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Danh Sách Phản Ánh Nghiệp Vụ Cán Bộ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredList.map((item) => {
            const isResolved = item.status === 'resolved' || item.status === 'closed';

            return (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {item.code}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.category === 'street_light' ? 'bg-amber-100 text-amber-800' :
                      item.category === 'flooding' ? 'bg-blue-100 text-blue-800' :
                      item.category === 'waste' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {item.category === 'street_light' ? '💡 Đèn đường' :
                       item.category === 'flooding' ? '🌊 Ngập nước' :
                       item.category === 'waste' ? '🗑️ Rác thải' : '🚧 Mặt đường'}
                    </span>
                    {item.priority === 'urgent' && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        KHẨN CẤP
                      </span>
                    )}
                    {item.sameReportsCount > 1 && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        🔥 {item.sameReportsCount} lượt báo trùng (Đã gộp)
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">📍 {item.location.address}</p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span>👤 Người gửi: <strong>{item.sender.name}</strong> ({item.sender.phone})</span>
                    {item.assignedTo && (
                      <span className="text-blue-700 font-semibold">
                        🏢 Đã giao: {item.assignedTo.unitName}
                      </span>
                    )}
                    {item.assignedTo?.deadline && (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hạn SLA: {new Date(item.assignedTo.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nút thao tác của cán bộ */}
                <div className="flex items-center gap-2">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => setDispatchTarget(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Giao xử lý & Hạn SLA</span>
                    </button>
                  )}

                  {isResolved ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã hoàn thành</span>
                    </span>
                  ) : item.status !== 'pending' ? (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md">
                      Đang xử lý tại hiện trường
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Điều phối giao việc */}
      {dispatchTarget && (
        <DispatchModal
          incident={dispatchTarget}
          onClose={() => setDispatchTarget(null)}
        />
      )}
    </div>
  );
};

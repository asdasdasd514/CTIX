import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Incident } from '../../types/incident';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  MapPin,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  ThumbsUp,
  ArrowRight,
  Camera,
  Layers,
} from 'lucide-react';

export const NearbyIncidentsMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, categoryFilter, setCategoryFilter, upvoteIncident } = useIncidentStore();
  const { currentUser } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);

  // Lọc dữ liệu hiển thị trên bản đồ
  const filteredList = incidents.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (statusFilter === 'pending' && (item.status === 'resolved' || item.status === 'closed')) return false;
    if (statusFilter === 'resolved' && item.status !== 'resolved' && item.status !== 'closed') return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* 1. HEADER (GÓC VUÔNG) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Giám Sát Phản Ánh Trên Bản Đồ (OpenStreetMap)
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider border border-blue-200">
              Không Gian Số
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Trực quan hóa vị trí các phản ánh đô thị thời gian thực • Bấm vào điểm ghim để xem chi tiết
          </p>
        </div>

        <button
          onClick={() => navigate('/citizen/submit')}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-black px-5 py-3 rounded-none shadow-sm transition shrink-0 active:scale-95 text-xs sm:text-sm border border-blue-900 uppercase tracking-wider"
        >
          <Camera className="w-4 h-4 text-white" />
          <span>+ GỬI PHẢN ÁNH MỚI</span>
        </button>
      </div>

      {/* 2. THANH LỌC DANH MỤC & TRẠNG THÁI (GÓC VUÔNG) */}
      <div className="bg-white p-4 rounded-none border border-slate-300 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Lọc sự cố:</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-none border border-slate-200">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition border ${
                categoryFilter === 'all'
                  ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({incidents.length})
            </button>
            <button
              onClick={() => setCategoryFilter('street_light')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition border ${
                categoryFilter === 'street_light'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" /> 💡 Đèn chiếu sáng
            </button>
            <button
              onClick={() => setCategoryFilter('flooding')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition border ${
                categoryFilter === 'flooding'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Waves className="w-3.5 h-3.5" /> 🌊 Ngập úng
            </button>
            <button
              onClick={() => setCategoryFilter('waste')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition border ${
                categoryFilter === 'waste'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> 🗑️ Rác thải
            </button>
            <button
              onClick={() => setCategoryFilter('road_damage')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition border ${
                categoryFilter === 'road_damage'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Construction className="w-3.5 h-3.5" /> 🚧 Ổ gà mặt đường
            </button>
          </div>
        </div>

        {/* Lọc trạng thái (GÓC VUÔNG) */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3.5 py-2 border border-slate-300 rounded-none text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chưa xử lý / Đang xử lý</option>
          <option value="resolved">Đã khắc phục xong</option>
        </select>
      </div>

      {/* 3. BỐ CỤC CHÍNH 2 CỘT CHUẨN MÀN HÌNH MÁY TÍNH (8 CỘT BẢN ĐỒ + 4 CỘT CHI TIẾT - GÓC VUÔNG) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* VÙNG BẢN ĐỒ THỰC TẾ OPENSTREETMAP (8 / 12 CỘT) */}
        <div className="lg:col-span-8 bg-white rounded-none overflow-hidden shadow-2xs relative border border-slate-300 flex flex-col">
          <OpenStreetMap
            height="580px"
            incidents={filteredList}
            selectedId={selectedIncident?.id}
            onMarkerClick={(item) => setSelectedIncident(item)}
          />

          {/* Chú giải nổi trên OpenStreetMap (GÓC VUÔNG) */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-800 p-3 rounded-none border border-slate-300 text-xs shadow-md flex flex-wrap items-center gap-3.5 z-[400]">
            <span className="font-extrabold text-slate-500 uppercase text-[10px]">Chú giải OSM:</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-none bg-amber-500" /> Đèn đường
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-none bg-blue-600" /> Ngập nước
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-600" /> Rác thải
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-none bg-rose-600" /> Ổ gà
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-600 ring-1 ring-emerald-400" /> Đã hoàn thành
            </span>
          </div>
        </div>

        {/* PANEL CHI TIẾT SỰ CỐ ĐANG CHỌN (4 / 12 CỘT - STICKY - GÓC VUÔNG) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white rounded-none border border-slate-300 shadow-2xs p-5 sm:p-6 space-y-4">
            {selectedIncident ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200">
                    {selectedIncident.code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-none border ${
                      selectedIncident.status === 'resolved' || selectedIncident.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {selectedIncident.status === 'resolved' || selectedIncident.status === 'closed'
                      ? '✓ Đã hoàn thành'
                      : 'Đang giải quyết'}
                  </span>
                </div>

                {/* Ảnh hiện trường */}
                <div className="aspect-video w-full rounded-none overflow-hidden bg-slate-100 border border-slate-300 shadow-2xs">
                  <img
                    src={selectedIncident.photosBefore[0]}
                    alt="Hiện trường"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-black text-slate-900 text-base leading-snug">
                    {selectedIncident.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                    {selectedIncident.description}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-none border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{selectedIncident.location.address}</span>
                  </div>
                  {selectedIncident.assignedTo && (
                    <div className="text-[11px] text-blue-800 pt-1.5 border-t border-slate-200 font-bold">
                      🏢 Đơn vị xử lý: {selectedIncident.assignedTo.unitName}
                    </div>
                  )}
                </div>

                {/* Nút đồng phản ánh (GÓC VUÔNG) */}
                <button
                  onClick={() => upvoteIncident(selectedIncident.id)}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-none text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                  <span>Tôi cũng thấy sự cố này (+{selectedIncident.sameReportsCount} người)</span>
                </button>

                {/* Nút phân công nhanh nếu là cán bộ */}
                {currentUser.role !== 'citizen' && selectedIncident.status === 'pending' && (
                  <button
                    onClick={() => navigate(`/dispatch/${selectedIncident.id}`)}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm border border-blue-900"
                  >
                    <span>Chuyển sang phân công xử lý</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Chạm vào bất kỳ điểm ghim nào trên bản đồ OpenStreetMap để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

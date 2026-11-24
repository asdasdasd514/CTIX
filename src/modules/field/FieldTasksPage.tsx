import React, { useState } from 'react';
import { useIncidentStore } from '../../store/useIncidentStore';
import { Incident } from '../../types/incident';
import { IncidentResolutionModal } from './IncidentResolutionModal';
import { Users, CheckCircle2, MapPin, Camera, Clock, ShieldAlert } from 'lucide-react';

export const FieldTasksPage: React.FC = () => {
  const { incidents, verifyIncident, elderlyMode } = useIncidentStore();

  const [activeSubTab, setActiveSubTab] = useState<'need_verify' | 'assigned' | 'completed'>('assigned');
  const [resolveTarget, setResolveTarget] = useState<Incident | null>(null);

  // Lọc nhiệm vụ của Đội Thanh niên & Lực lượng Hiện trường
  const needVerifyList = incidents.filter(i => i.status === 'pending' || !i.verifiedByVolunteer);
  const assignedList = incidents.filter(i => i.status === 'assigned' || i.status === 'in_progress');
  const completedList = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');

  const currentList = activeSubTab === 'need_verify' ? needVerifyList : activeSubTab === 'assigned' ? assignedList : completedList;

  const handleQuickVerify = (id: string) => {
    const notes = prompt('Nhập kết quả xác minh tại chỗ (Ví dụ: "Đã kiểm tra thực tế có ổ gà sâu 12cm đúng như người dân báo"):');
    if (notes !== null) {
      verifyIncident(id, notes);
      alert('Đã xác nhận tin báo có thật! UBND Phường đã nhận được kết quả xác minh.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold uppercase">
            Vai trò 3 • Đội Thanh niên tình nguyện & Hiện trường
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Nhiệm Vụ Xác Minh & Nghiệm Thu Hiện Trường
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hỗ trợ UBND Phường Trấn Biên xác minh tin báo và chụp ảnh hoàn thành sau xử lý
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveSubTab('assigned')}
          className={`px-3 py-1.5 text-xs font-semibold rounded ${activeSubTab === 'assigned' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Cần xử lý & Nghiệm thu ({assignedList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('need_verify')}
          className={`px-3 py-1.5 text-xs font-semibold rounded ${activeSubTab === 'need_verify' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Cần xác minh tại chỗ ({needVerifyList.length})
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`px-3 py-1.5 text-xs font-semibold rounded ${activeSubTab === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Đã nghiệm thu xong ({completedList.length})
        </button>
      </div>

      {/* Danh sách nhiệm vụ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {currentList.map((item) => {
          const isResolved = item.status === 'resolved' || item.status === 'closed';

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.verifiedByVolunteer ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.verifiedByVolunteer ? '✓ Đã xác minh tại chỗ' : 'Chưa xác minh'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img src={item.photosBefore[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span className="truncate">{item.location.address}</span>
                    </div>
                  </div>
                </div>

                {item.assignedTo && (
                  <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 space-y-0.5">
                    <div className="text-slate-700">🏢 <strong>Giao cho:</strong> {item.assignedTo.unitName}</div>
                    <div className="text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hạn SLA: {new Date(item.assignedTo.deadline).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                )}
              </div>

              {/* Thao tác */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {!item.verifiedByVolunteer && (
                  <button
                    onClick={() => handleQuickVerify(item.id)}
                    className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition"
                  >
                    🔍 Xác minh tại chỗ
                  </button>
                )}

                {!isResolved ? (
                  <button
                    onClick={() => setResolveTarget(item)}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Màn 5: Nghiệm thu ảnh Sau</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Đã hoàn thành nghiệm thu
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nghiệm thu kết quả Màn hình 5 */}
      {resolveTarget && (
        <IncidentResolutionModal
          incident={resolveTarget}
          onClose={() => setResolveTarget(null)}
        />
      )}
    </div>
  );
};

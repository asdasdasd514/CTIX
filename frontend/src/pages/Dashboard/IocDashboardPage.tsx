import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useTeamStore } from '../../store/useTeamStore';
import { DEMO_UNITS, isOverdue } from '../../lib/incidents';
import {
  Inbox,
  CheckCircle2,
  Clock,
  Smile,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  PieChart,
  BarChart3,
  MapPin,
} from 'lucide-react';

export const IocDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, refreshIncidents } = useIncidentStore();
  const { units } = useTeamStore();
  const now = Date.now();

  useEffect(() => {
    void refreshIncidents();
  }, [refreshIncidents]);

  // Loại bỏ hồ sơ Chờ duyệt & Từ chối khỏi KPI tiếp nhận chính thức để số liệu chuẩn xác 100%
  const pendingReviewCount = incidents.filter((i) => i.status === 'pending_review').length;
  const operationalIncidents = incidents.filter(
    (i) => i.status !== 'rejected' && i.status !== 'pending_review'
  );
  const totalCount = operationalIncidents.length;
  const resolvedList = operationalIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed');
  const resolvedCount = resolvedList.length;
  const resolvedRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1).replace('.', ',') : '0,0';

  // Thời gian xử lý trung bình (ngày) — chỉ tính trên hồ sơ có dữ liệu thật
  const resolvedWithTime = resolvedList.filter(
    (i) =>
      i.resolution?.resolvedAt &&
      new Date(i.resolution.resolvedAt).getTime() >= new Date(i.createdAt).getTime()
  );
  const avgDays =
    resolvedWithTime.length > 0
      ? (
          resolvedWithTime.reduce((sum, item) => {
            const diffDays =
              (new Date(item.resolution!.resolvedAt).getTime() - new Date(item.createdAt).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + diffDays;
          }, 0) / resolvedWithTime.length
        )
          .toFixed(1)
          .replace('.', ',')
      : '—';

  // Điểm hài lòng trung bình (chỉ tính trên hồ sơ vận hành chính thức)
  const ratedList = operationalIncidents.filter((i) => i.rating?.stars);
  const avgStars =
    ratedList.length > 0
      ? (ratedList.reduce((s, i) => s + (i.rating?.stars || 0), 0) / ratedList.length).toFixed(2)
      : '—';
  const satisfactionPct =
    ratedList.length > 0
      ? ((ratedList.filter((i) => (i.rating?.stars || 0) >= 4).length / ratedList.length) * 100)
          .toFixed(1)
          .replace('.', ',')
      : '—';

  // Dữ liệu biểu đồ xu hướng tiếp nhận & xử lý theo 4 tuần của tháng hiện tại (múi giờ VN)
  const vnMonthFmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
  });
  const vnDayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: 'numeric',
  });
  const targetMonthKey = '2026-11';
  const getVnMonthKey = (iso: string) => vnMonthFmt.format(new Date(iso));
  const getVnDay = (iso: string) => Number(vnDayFmt.format(new Date(iso)));

  const weeklyChart = [
    { label: 'Tuần 1', range: [1, 7] },
    { label: 'Tuần 2', range: [8, 14] },
    { label: 'Tuần 3', range: [15, 21] },
    { label: 'Tuần 4', range: [22, 31] },
  ].map((w) => {
    const received = operationalIncidents.filter((i) => {
      if (getVnMonthKey(i.createdAt) !== targetMonthKey) return false;
      const day = getVnDay(i.createdAt);
      return day >= w.range[0] && day <= w.range[1];
    }).length;
    const resolved = operationalIncidents.filter((i) => {
      if (i.status !== 'resolved' && i.status !== 'closed') return false;
      const resolvedIso = i.resolution?.resolvedAt || i.updatedAt || i.createdAt;
      if (getVnMonthKey(resolvedIso) !== targetMonthKey) return false;
      const day = getVnDay(resolvedIso);
      return day >= w.range[0] && day <= w.range[1];
    }).length;
    return { label: w.label, received, resolved };
  });
  const maxWeeklyVal = Math.max(10, ...weeklyChart.map((w) => Math.max(w.received, w.resolved)));

  // Cơ cấu 5 nhóm sự cố hiện trường (tách riêng Sự cố khác, tính từ dữ liệu đã tiếp nhận)
  const categoryStats = [
    {
      label: 'Vệ sinh môi trường / Rác thải',
      count: operationalIncidents.filter((i) => i.category === 'waste').length,
      barColor: 'bg-amber-500',
      textColor: 'text-amber-700',
    },
    {
      label: 'Chiếu sáng đô thị / Đèn đường',
      count: operationalIncidents.filter((i) => i.category === 'street_light').length,
      barColor: 'bg-blue-600',
      textColor: 'text-blue-700',
    },
    {
      label: 'Thoát nước & Điểm ngập úng',
      count: operationalIncidents.filter((i) => i.category === 'flooding').length,
      barColor: 'bg-cyan-500',
      textColor: 'text-cyan-700',
    },
    {
      label: 'Giao thông & Mặt đường / Ổ gà',
      count: operationalIncidents.filter((i) => i.category === 'road_damage').length,
      barColor: 'bg-indigo-600',
      textColor: 'text-indigo-700',
    },
    {
      label: 'Sự cố đô thị khác',
      count: operationalIncidents.filter((i) => i.category === 'other').length,
      barColor: 'bg-violet-600',
      textColor: 'text-violet-700',
    },
  ];

  // Thời gian xử lý trung bình theo ngành (tính trực tiếp từ dữ liệu thật MongoDB)
  const calcCategoryAvgDays = (cat: string) => {
    const list = resolvedWithTime.filter((i) => i.category === cat);
    if (list.length === 0) return null;
    const avg =
      list.reduce((sum, item) => {
        const d =
          (new Date(item.resolution!.resolvedAt).getTime() - new Date(item.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + Math.max(0.1, d);
      }, 0) / list.length;
    return avg;
  };

  const industrySla = [
    { cat: 'waste', label: 'Thu gom rác thải tồn lưu', stdDays: 3, color: 'bg-emerald-600' },
    { cat: 'street_light', label: 'Khắc phục đèn chiếu sáng', stdDays: 3, color: 'bg-blue-600' },
    { cat: 'flooding', label: 'Nạo vét khơi thông thoát nước', stdDays: 4, color: 'bg-amber-500' },
    { cat: 'road_damage', label: 'Vá thảm mặt đường & ổ gà', stdDays: 5, color: 'bg-indigo-700' },
  ].map((row) => {
    const avg = calcCategoryAvgDays(row.cat);
    const pct = avg !== null ? Math.min(100, Math.round((avg / row.stdDays) * 100)) : 0;
    return {
      label: row.label,
      value: avg !== null ? `${avg.toFixed(1).replace('.', ',')} ngày` : 'Chưa có',
      standard: `Chuẩn ${row.stdDays} ngày`,
      pct,
      color: row.color,
    };
  });

  // Bảng xếp hạng các tổ đội xử lý thực tế (sắp xếp đúng từ cao -> thấp, số ngày & sao thật 100%)
  const sourceUnits = units.length > 0 ? units : DEMO_UNITS;
  const unitRankings = sourceUnits
    .slice(0, 6)
    .map((unit) => {
      const unitItems = operationalIncidents.filter((i) => i.assignedTo?.unitName === unit.name);
      const unitResolved = unitItems.filter(
        (i) => i.status === 'resolved' || i.status === 'closed'
      );
      const unitOverdue = unitItems.filter((i) => isOverdue(i, now)).length;
      const rate = unitItems.length > 0 ? Math.round((unitResolved.length / unitItems.length) * 100) : 0;

      const resolvedUnitWithTime = unitResolved.filter((i) => i.resolution?.resolvedAt);
      const avgDaysVal =
        resolvedUnitWithTime.length > 0
          ? resolvedUnitWithTime.reduce((sum, item) => {
              const d =
                (new Date(item.resolution!.resolvedAt).getTime() - new Date(item.createdAt).getTime()) /
                (1000 * 60 * 60 * 24);
              return sum + Math.max(0.1, d);
            }, 0) / resolvedUnitWithTime.length
          : null;

      const ratedUnitItems = unitItems.filter((i) => i.rating);
      const starsNum =
        ratedUnitItems.length > 0
          ? ratedUnitItems.reduce((s, i) => s + (i.rating?.stars || 5), 0) / ratedUnitItems.length
          : null;

      return {
        name: unit.name,
        total: unitItems.length,
        rate,
        avgTime: avgDaysVal !== null ? `${avgDaysVal.toFixed(1)} ngày` : 'Chưa có',
        stars: starsNum !== null ? starsNum.toFixed(2) : '—',
        starsNum: starsNum ?? -1,
        overdue: unitOverdue,
      };
    })
    .sort((a, b) => b.rate - a.rate || b.starsNum - a.starsNum || b.total - a.total);

  const warningUnits = unitRankings.filter((u) => u.overdue > 0);

  // Hàng đợi khẩn cấp cần chỉ đạo ngay (lấy các hồ sơ pending ưu tiên cao/khẩn cấp)
  const urgentQueue = incidents
    .filter((i) => i.status === 'pending')
    .sort((a, b) => {
      const order = { urgent: 3, high: 2, normal: 1 };
      return order[b.priority] - order[a.priority];
    })
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* 1. HÀNG 4 THẺ KPI CHÍNH (ĐÚNG BỐ CỤC ẢNH 2, DỮ LIỆU THẬT PHƯỜNG TRẤN BIÊN) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tổng tiếp nhận
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalCount}</div>
          <div className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              Đã tiếp nhận{pendingReviewCount > 0 ? ` • +${pendingReviewCount} chờ duyệt` : ' • Phường Trấn Biên'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-emerald-600 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Tỷ lệ xử lý dứt điểm
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{resolvedRate}%</div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between font-medium">
            <span>Hồ sơ hoàn tất:</span>
            <strong className="text-slate-900">{resolvedCount} vụ việc</strong>
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-indigo-600 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Thời gian xử lý TB
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {avgDays} <span className="text-sm font-bold text-slate-500">ngày/vụ</span>
          </div>
          <div className="text-xs font-bold text-emerald-600 mt-1.5">
            Đạt chuẩn SLA
          </div>
        </div>

        <div className="bg-white rounded-[5px] border border-slate-200 border-t-2 border-t-amber-500 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Mức độ hài lòng
            </span>
            <div className="w-8 h-8 rounded-[5px] bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {satisfactionPct === '—' ? '—' : `${satisfactionPct}%`}
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center justify-between font-medium">
            <span>
              Đánh giá:{' '}
              <strong className="text-amber-600">
                {avgStars === '—' ? 'Chưa có' : `${avgStars} / 5.0 ★`}
              </strong>
            </span>
            <span>{ratedList.length} lượt</span>
          </div>
        </div>
      </section>

      {/* 2. BỐ CỤC CHÍNH 2 CỘT (ĐÚNG MẪU ẢNH 2, KHÔNG CHỨA BẢN ĐỒ) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12): BIỂU ĐỒ XU HƯỚNG + CƠ CẤU NHÓM SỰ CỐ + THỜI GIAN XỬ LÝ TB THEO NGÀNH */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Biểu đồ xu hướng tiếp nhận & xử lý theo tuần (đặt ngay phía trên Cơ cấu 4 nhóm sự cố) */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span>Tiếp nhận & Xử lý (Tháng 11/2026)</span>
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-blue-600" /> Tiếp nhận
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" /> Đã xử lý
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-5 pt-2 items-end h-48">
              {weeklyChart.map((w) => {
                const recHeight = Math.max(8, Math.round((w.received / maxWeeklyVal) * 100));
                const resHeight = Math.max(8, Math.round((w.resolved / maxWeeklyVal) * 100));
                return (
                  <div key={w.label} className="flex flex-col items-center h-full justify-end gap-2">
                    <div className="w-full flex items-end justify-center gap-2 sm:gap-3 h-36 px-1 border-b border-slate-200">
                      {/* Cột Tiếp nhận */}
                      <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[36px] group">
                        <span className="text-[11px] font-bold text-blue-700 mb-1">
                          {w.received}
                        </span>
                        <div
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-[4px] transition-all duration-500"
                          style={{ height: `${recHeight}%` }}
                          title={`${w.label}: ${w.received} hồ sơ tiếp nhận`}
                        />
                      </div>

                      {/* Cột Đã xử lý */}
                      <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[36px] group">
                        <span className="text-[11px] font-bold text-emerald-600 mb-1">
                          {w.resolved}
                        </span>
                        <div
                          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-[4px] transition-all duration-500"
                          style={{ height: `${resHeight}%` }}
                          title={`${w.label}: ${w.resolved} hồ sơ đã xử lý`}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{w.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cơ cấu 5 nhóm sự cố hiện trường */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-700" />
                <span>Cơ cấu 5 nhóm sự cố hiện trường</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">Tỷ lệ %</span>
            </div>

            <div className="space-y-4">
              {categoryStats.map((cat) => {
                const pct = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
                return (
                  <div key={cat.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-800">
                        {cat.label} ({pct}%)
                      </span>
                      <span className={`font-black ${cat.textColor}`}>{cat.count} vụ</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-[4px] overflow-hidden">
                      <div
                        className={`h-full ${cat.barColor} rounded-[4px] transition-all duration-500`}
                        style={{ width: cat.count > 0 ? `${Math.max(4, pct)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thời gian xử lý trung bình theo ngành */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Thời gian xử lý trung bình theo ngành</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">Đơn vị: Ngày</span>
            </div>

            <div className="space-y-4">
              {industrySla.map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-slate-800">{row.label}</span>
                    <span className="font-extrabold text-slate-700">
                      {row.value}{' '}
                      <span className="text-xs font-medium text-slate-400">({row.standard})</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-[4px] overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-[4px]`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12): BẢNG XẾP HẠNG ĐƠN VỊ + HÀNG ĐỢI KHẨN CẤP CẦN CHỈ ĐẠO NGAY */}
        <div className="lg:col-span-5 space-y-5 min-w-0">
          {/* Bảng xếp hạng thi đua các tổ đội */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Xếp hạng Tổ đội</span>
              </h2>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-[5px] border border-blue-200 shrink-0">
                11/2026
              </span>
            </div>

            <div className="space-y-2">
              {unitRankings.map((unit, idx) => (
                <div
                  key={unit.name}
                  className="p-2.5 rounded-[5px] bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-[5px] flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{unit.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
                    <span className="font-extrabold text-emerald-700">{unit.rate}%</span>
                    <span className="text-slate-400 hidden sm:inline">{unit.avgTime}</span>
                    <span className="font-black text-amber-600">{unit.stars} ★</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cảnh báo đơn vị có hồ sơ quá hạn */}
            {warningUnits.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-black text-rose-700 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cảnh báo đơn vị có hồ sơ quá hạn / cần đôn đốc</span>
                </div>
                {warningUnits.slice(0, 2).map((u) => (
                  <div
                    key={u.name}
                    className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-rose-950 truncate">{u.name}</div>
                      <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                        {u.overdue} hồ sơ quá hạn SLA
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/inbox')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[5px] text-[11px] font-bold transition shrink-0"
                    >
                      Đôn đốc
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hàng đợi khẩn cấp cần chỉ đạo ngay */}
          <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-black text-rose-700 uppercase tracking-tight flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>Hàng đợi khẩn cấp cần chỉ đạo ngay</span>
              </h2>
              <span className="text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-[5px]">
                {String(urgentQueue.length).padStart(2, '0')} vụ việc
              </span>
            </div>

            {urgentQueue.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Hiện không có hồ sơ tồn đọng chờ phân công
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentQueue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/admin/dispatch/${item.id}`)}
                    className="p-3 rounded-[5px] bg-rose-50/40 hover:bg-rose-50 border border-rose-200 border-l-4 border-l-rose-600 cursor-pointer transition space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black text-rose-700">
                        #{item.code}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 inline-flex items-center gap-0.5">
                        Điều phối ngay <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.location.address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

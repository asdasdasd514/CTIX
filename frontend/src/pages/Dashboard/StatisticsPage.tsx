import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Map as MapIcon,
  AlertTriangle,
  Search,
  Clock,
  ClipboardList,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
import { MonthPicker } from "../../components/common/MonthPicker";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  UNASSIGNED_UNIT_FILTER,
  compareDispatchPriority,
  deadlineLabel,
  formatDate,
  getAllKnownAssignees,
  getAllKnownUnits,
  incidentMonthKey,
  incidentStats,
  isComplete,
  isOverdue,
} from "../../lib/incidents";
import type { IncidentCategory } from "../../types/incident";

export function StatisticsPage() {
  const { incidents, lastSyncedAt } = useIncidentStore();
  const [month, setMonth] = useState("2026-11");
  const [category, setCategory] = useState<IncidentCategory | "all">("all");
  const [unit, setUnit] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [now] = useState(() => Date.now());

  const unitOptions = useMemo(() => getAllKnownUnits(incidents), [incidents]);
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const item of incidents) {
      if (item.status !== "rejected" && item.status !== "pending_review") {
        set.add(incidentMonthKey(item.createdAt));
      }
    }
    return Array.from(set);
  }, [incidents]);
  const assigneeOptions = useMemo(
    () => getAllKnownAssignees(incidents),
    [incidents],
  );
  const activeAssignee =
    assignee !== "all" && assigneeOptions.includes(assignee) ? assignee : "all";

  const items = useMemo(
    () =>
      incidents.filter((i) => {
        if (i.status === "rejected" || i.status === "pending_review") return false;
        if (month && incidentMonthKey(i.createdAt) !== month) return false;
        if (category !== "all" && i.category !== category) return false;
        if (unit === UNASSIGNED_UNIT_FILTER && i.assignedTo) return false;
        if (
          unit !== "all" &&
          unit !== UNASSIGNED_UNIT_FILTER &&
          i.assignedTo?.unitName !== unit
        )
          return false;
        if (
          activeAssignee !== "all" &&
          (i.assignedTo?.assigneeName || "") !== activeAssignee
        )
          return false;
        return true;
      }),
    [incidents, month, category, unit, activeAssignee],
  );

  const stats = useMemo(() => incidentStats(items, now), [items, now]);
  const decimal = (value: number | null) =>
    value === null
      ? "Chưa có dữ liệu"
      : value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

  const buildListUrl = (overrides?: {
    status?: string;
    category?: string;
    unit?: string;
  }) => {
    const params = new URLSearchParams();
    if (overrides?.status) params.set("status", overrides.status);
    const catVal = overrides?.category ?? category;
    if (catVal && catVal !== "all") params.set("category", catVal);
    const unitVal = overrides?.unit ?? unit;
    if (unitVal && unitVal !== "all") params.set("unit", unitVal);
    if (month) params.set("month", month);
    if (activeAssignee !== "all") params.set("assignee", activeAssignee);
    const qs = params.toString();
    return qs ? `/admin/inbox?${qs}` : "/admin/inbox";
  };

  const buildMapUrl = () => {
    const params = new URLSearchParams();
    params.set("status", "all");
    if (category !== "all") params.set("category", category);
    if (unit !== "all") params.set("unit", unit);
    if (month) params.set("month", month);
    return `/admin/map?${params.toString()}`;
  };

  const unitRows = useMemo(() => {
    const map = new Map<
      string,
      {
        unitName: string;
        assigned: number;
        inProgress: number;
        overdue: number;
        completed: number;
      }
    >();
    for (const item of items) {
      if (!item.assignedTo) continue;
      const key = item.assignedTo.unitName;
      const row = map.get(key) ?? {
        unitName: key,
        assigned: 0,
        inProgress: 0,
        overdue: 0,
        completed: 0,
      };
      if (item.status === "assigned") row.assigned += 1;
      if (item.status === "in_progress") row.inProgress += 1;
      if (isOverdue(item, now)) row.overdue += 1;
      if (isComplete(item)) row.completed += 1;
      map.set(key, row);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        b.overdue - a.overdue ||
        b.assigned + b.inProgress - (a.assigned + a.inProgress),
    );
  }, [items, now]);

  const attentionItems = useMemo(
    () =>
      items
        .filter(
          (i) => !isComplete(i) && (isOverdue(i, now) || i.priority === "urgent"),
        )
        .sort((a, b) => compareDispatchPriority(a, b, now))
        .slice(0, 8),
    [items, now],
  );

  const clearFilters = () => {
    setMonth("");
    setCategory("all");
    setUnit("all");
    setAssignee("all");
  };

  return (
    <div className="officer-workbench">
      {/* 1. Phạm vi thống kê và thời điểm cập nhật */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            Thống kê phản ánh
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cập nhật {formatDate(lastSyncedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            to={buildMapUrl()}
          >
            <MapIcon size={15} className="text-blue-600" aria-hidden="true" />
            Xem trên bản đồ
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[5px] bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white transition"
            to={buildListUrl({ status: "all" })}
          >
            Mở Tiếp nhận & phân công
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Bộ lọc chuẩn đồng bộ phong cách toàn hệ thống */}
      <section
        className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-4 space-y-3.5"
        aria-label="Bộ lọc phạm vi thống kê"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc phạm vi thống kê</span>
            <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 text-[11px] font-semibold">
              {items.length} hồ sơ phù hợp
            </span>
          </div>
          {(month || category !== "all" || unit !== "all" || activeAssignee !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Hàng 1: Chọn nhanh loại sự cố dạng chip giống Công dân & Tiếp nhận */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold border transition ${
              category === "all"
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Tất cả lĩnh vực
          </button>
          {Object.entries(CATEGORIES).map(([id, label]) => {
            const active = category === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(active ? "all" : (id as IncidentCategory))}
                className={`px-3 py-1.5 rounded-[5px] text-xs font-semibold border transition ${
                  active
                    ? "bg-blue-50 text-blue-700 border-blue-400"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Hàng 2: Tháng tiếp nhận, Đơn vị phụ trách, Người phụ trách */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            assigneeOptions.length > 0 ? "lg:grid-cols-3" : "lg:grid-cols-2"
          } gap-3`}
        >
          <div className="block">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tháng tiếp nhận
            </span>
            <MonthPicker
              value={month}
              onChange={setMonth}
              availableMonths={availableMonths}
              ariaLabel="Tháng tiếp nhận"
            />
          </div>

          <label className="block">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Đơn vị phụ trách
            </span>
            <select
              aria-label="Lọc thống kê theo đơn vị"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-10 px-3 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="all">Tất cả đơn vị</option>
              <option value={UNASSIGNED_UNIT_FILTER}>Chưa giao đơn vị</option>
              {unitOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {assigneeOptions.length > 0 && (
            <label className="block">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Người phụ trách
              </span>
              <select
                aria-label="Lọc thống kê theo người phụ trách"
                value={activeAssignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full h-10 px-3 rounded-[5px] border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="all">Tất cả người phụ trách</option>
                {assigneeOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      {items.length === 0 ? (
        <section className="work-surface work-empty" role="status">
          <Search size={28} aria-hidden="true" />
          <h3>Không có hồ sơ trong phạm vi đã chọn</h3>
          <p>Thử chọn tháng khác hoặc xóa bộ lọc để xem số liệu tổng hợp.</p>
          <button
            type="button"
            className="work-secondary"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </button>
        </section>
      ) : (
        <>
          {/* 2. Tổng tiếp nhận, chờ phân công, đang xử lý, quá hạn */}
          <div
            className="work-metrics"
            aria-label="Tổng quan hồ sơ trong phạm vi lọc"
          >
            <Link
              className="work-metric stat-link-card"
              to={buildListUrl({ status: "all" })}
            >
              <span className="metric-symbol blue">
                <ClipboardList size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="metric-label">Tổng tiếp nhận (hồ sơ)</span>
                <strong>{stats.total}</strong>
                <span className="stat-sub">
                  {stats.totalReportsCount} lượt phản ánh/đồng phản ánh
                </span>
              </span>
            </Link>
            <Link
              className="work-metric stat-link-card"
              to={buildListUrl({ status: "pending" })}
            >
              <span className="metric-symbol amber">
                <ClipboardList size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="metric-label">Chờ phân công</span>
                <strong>{stats.pending}</strong>
              </span>
            </Link>
            <Link
              className="work-metric stat-link-card"
              to={buildListUrl({ status: "open" })}
            >
              <span className="metric-symbol blue">
                <Clock size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="metric-label">Đang xử lý (đã giao + làm)</span>
                <strong>{stats.active}</strong>
              </span>
            </Link>
            <Link
              className="work-metric stat-link-card"
              to={buildListUrl({ status: "overdue" })}
            >
              <span className="metric-symbol rose">
                <AlertTriangle size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="metric-label">Quá hạn (tập con chưa xong)</span>
                <strong>{stats.overdue}</strong>
              </span>
            </Link>
          </div>

          {/* 3. Kết quả xử lý */}
          <section className="work-surface work-detail">
            <h3>Kết quả xử lý</h3>
            <table className="work-stat-table">
              <tbody>
                <tr>
                  <th>Số hồ sơ đã xử lý</th>
                  <td>
                    <Link
                      className="work-text-link"
                      to={buildListUrl({ status: "completed" })}
                    >
                      {stats.completed}/{stats.total} hồ sơ{" "}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
                <tr>
                  <th>Tỷ lệ hoàn tất (đã xử lý / tổng tiếp nhận)</th>
                  <td>{decimal((stats.completed / stats.total) * 100)}%</td>
                </tr>
                <tr>
                  <th>Thời gian xử lý trung bình</th>
                  <td>
                    {stats.averageDays === null
                      ? "Chưa có dữ liệu"
                      : `${decimal(stats.averageDays)} ngày (tính trên ${stats.averageDaysCount} hồ sơ)`}
                  </td>
                </tr>
                <tr>
                  <th>Tỷ lệ đúng hạn (hồ sơ có đủ hạn & thời điểm xong)</th>
                  <td>
                    {stats.onTime === null
                      ? "Chưa đủ dữ liệu"
                      : `${decimal(stats.onTime)}% (${stats.onTimeCount}/${stats.onTimeTotal} hồ sơ)`}
                  </td>
                </tr>
                <tr>
                  <th>Đánh giá người dân</th>
                  <td>
                    {stats.averageRating === null
                      ? "Chưa có đánh giá"
                      : `${decimal(stats.averageRating)}/5 sao (${stats.rated} lượt đánh giá)`}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="work-help">
              Tổng tiếp nhận = Chờ phân công ({stats.pending}) + Đang xử lý (
              {stats.active}) + Đã xử lý ({stats.completed}). Nhóm Quá hạn (
              {stats.overdue}) là tập con giao nhau nên không cộng thêm vào tổng.
            </p>
          </section>

          {/* 4. Biểu đồ thanh theo loại sự cố */}
          <section className="work-surface work-detail">
            <h3>Cơ cấu theo loại sự cố</h3>
            <div className="category-stats">
              {Object.entries(CATEGORIES).map(([key, label]) => {
                const count = items.filter((i) => i.category === key).length;
                return (
                  <Link
                    key={key}
                    className="category-stat-row"
                    to={buildListUrl({ status: "all", category: key })}
                  >
                    <span>{label}</span>
                    <progress
                      value={count}
                      max={items.length || 1}
                      aria-label={label}
                    />
                    <strong>{count}</strong>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 5. Bảng khối lượng theo đơn vị */}
          <section className="work-surface work-detail">
            <h3>Khối lượng theo đơn vị phụ trách</h3>
            {unitRows.length ? (
              <div className="stat-table-scroll">
                <table className="work-stat-table stat-unit-table">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Chờ nhận</th>
                      <th>Đang xử lý</th>
                      <th>Quá hạn</th>
                      <th>Đã hoàn tất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitRows.map((row) => (
                      <tr key={row.unitName}>
                        <th>
                          <Link
                            className="work-text-link"
                            to={buildListUrl({
                              status: "all",
                              unit: row.unitName,
                            })}
                          >
                            {row.unitName}
                          </Link>
                        </th>
                        <td>
                          <Link
                            className="stat-cell-link"
                            to={buildListUrl({
                              status: "assigned",
                              unit: row.unitName,
                            })}
                          >
                            {row.assigned}
                          </Link>
                        </td>
                        <td>
                          <Link
                            className="stat-cell-link"
                            to={buildListUrl({
                              status: "in_progress",
                              unit: row.unitName,
                            })}
                          >
                            {row.inProgress}
                          </Link>
                        </td>
                        <td>
                          <Link
                            className={`stat-cell-link ${row.overdue > 0 ? "overdue-text" : ""}`}
                            to={buildListUrl({
                              status: "overdue",
                              unit: row.unitName,
                            })}
                          >
                            {row.overdue}
                          </Link>
                        </td>
                        <td>
                          <Link
                            className="stat-cell-link"
                            to={buildListUrl({
                              status: "completed",
                              unit: row.unitName,
                            })}
                          >
                            {row.completed}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="work-help">
                Chưa có hồ sơ nào được giao cho đơn vị trong phạm vi lọc này.
              </p>
            )}
          </section>

          {/* 6. Danh sách hồ sơ cần chú ý */}
          <section className="work-surface work-detail">
            <h3>Hồ sơ cần chú ý (quá hạn / khẩn cấp chưa xong)</h3>
            {attentionItems.length ? (
              <ul className="stat-attention-list">
                {attentionItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      className="stat-attention-item"
                      to={`/admin/dispatch/${encodeURIComponent(item.id)}?from=statistics`}
                    >
                      <div>
                        <span className="work-code">{item.code}</span>{" "}
                        <strong>{item.title}</strong>
                        <p className="work-help">
                          {item.location.address} · {CATEGORIES[item.category]} ·{" "}
                          {PRIORITY_LABELS[item.priority]} ·{" "}
                          {STATUS_LABELS[item.status]}
                        </p>
                      </div>
                      <span
                        className={
                          isOverdue(item, now) ? "overdue-text" : "work-help"
                        }
                      >
                        {deadlineLabel(item, now)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="work-help">
                <CheckCircle2 size={15} aria-hidden="true" /> Không có hồ sơ quá
                hạn hay khẩn cấp chưa hoàn tất trong phạm vi này.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

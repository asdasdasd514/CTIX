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
} from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
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
  const assigneeOptions = useMemo(
    () => getAllKnownAssignees(incidents),
    [incidents],
  );
  const activeAssignee =
    assignee !== "all" && assigneeOptions.includes(assignee) ? assignee : "all";

  const items = useMemo(
    () =>
      incidents.filter((i) => {
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
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  const buildMapUrl = () => {
    const params = new URLSearchParams();
    params.set("status", "all");
    if (category !== "all") params.set("category", category);
    if (unit !== "all") params.set("unit", unit);
    if (month) params.set("month", month);
    return `/map?${params.toString()}`;
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
      <div className="work-heading">
        <div>
          <h2>Thống kê phản ánh</h2>
          <p>
            Hồ sơ tiếp nhận trong kỳ, trạng thái tính đến thời điểm cập nhật ·
            Cập nhật {formatDate(lastSyncedAt)}
          </p>
        </div>
        <div className="work-heading-links">
          <Link className="work-secondary" to={buildMapUrl()}>
            <MapIcon size={16} aria-hidden="true" />
            Xem danh sách này trên bản đồ
          </Link>
          <Link className="work-text-link" to={buildListUrl({ status: "all" })}>
            Mở Tiếp nhận & phân công{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <section className="work-surface" aria-label="Bộ lọc phạm vi thống kê">
        <div className="work-toolbar">
          <label className="stat-filter-field">
            <span>Tháng tiếp nhận</span>
            <input
              aria-label="Tháng tiếp nhận"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <label className="stat-filter-field">
            <span>Loại sự cố</span>
            <select
              aria-label="Lọc thống kê theo loại sự cố"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as IncidentCategory | "all")
              }
            >
              <option value="all">Tất cả loại sự cố</option>
              {Object.entries(CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="stat-filter-field">
            <span>Đơn vị phụ trách</span>
            <select
              aria-label="Lọc thống kê theo đơn vị"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
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
            <label className="stat-filter-field">
              <span>Người phụ trách</span>
              <select
                aria-label="Lọc thống kê theo người phụ trách"
                value={activeAssignee}
                onChange={(e) => setAssignee(e.target.value)}
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
          {(month || category !== "all" || unit !== "all" || activeAssignee !== "all") && (
            <button
              type="button"
              className="work-secondary"
              onClick={clearFilters}
            >
              Xem tất cả
            </button>
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
                      to={`/dispatch/${encodeURIComponent(item.id)}?from=statistics`}
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

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  Map,
  ArrowUpRight,
  ArrowLeft,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Send,
} from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  IncidentDispatchForm,
  IncidentOverview,
  type DispatchReceipt,
} from "../../components/Incidents/IncidentDispatchForm";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  UNASSIGNED_UNIT_FILTER,
  compareDispatchPriority,
  deadlineLabel,
  formatDate,
  getAllKnownUnits,
  getAssigneeLabel,
  getIncidentMapVisual,
  incidentMonthKey,
  incidentStats,
  isComplete,
  isOverdue,
} from "../../lib/incidents";
import type {
  IncidentCategory,
  IncidentPriority,
} from "../../types/incident";

type WorkFilter =
  | "open"
  | "all"
  | "pending"
  | "assigned"
  | "in_progress"
  | "overdue"
  | "completed";

const VALID_FILTERS: WorkFilter[] = [
  "open",
  "all",
  "pending",
  "assigned",
  "in_progress",
  "overdue",
  "completed",
];

export function OfficerWorkbench() {
  const { incidents, syncNotice, selectedIncidentId, setSelectedIncidentId } =
    useIncidentStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get("status");
  const initialCategory = searchParams.get("category");
  const initialPriority = searchParams.get("priority");

  const [filter, setFilter] = useState<WorkFilter>(
    initialStatus && VALID_FILTERS.includes(initialStatus as WorkFilter)
      ? (initialStatus as WorkFilter)
      : "open",
  );
  const [category, setCategory] = useState<IncidentCategory | "all">(
    initialCategory && Object.hasOwn(CATEGORIES, initialCategory)
      ? (initialCategory as IncidentCategory)
      : "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    IncidentPriority | "all"
  >(
    initialPriority && ["normal", "high", "urgent"].includes(initialPriority)
      ? (initialPriority as IncidentPriority)
      : searchParams.get("urgent") === "1"
        ? "urgent"
        : "all",
  );
  const [unitFilter, setUnitFilter] = useState(
    searchParams.get("unit") || "all",
  );
  const [monthFilter, setMonthFilter] = useState(
    searchParams.get("month") || "",
  );
  const [assigneeFilter, setAssigneeFilter] = useState(
    searchParams.get("assignee") || "all",
  );
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [justDispatched, setJustDispatched] = useState<DispatchReceipt | null>(
    null,
  );
  const [now, setNow] = useState(() => Date.now());
  const detailSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const unitOptions = useMemo(() => getAllKnownUnits(incidents), [incidents]);
  const scopedByMonth = useMemo(
    () =>
      monthFilter
        ? incidents.filter(
            (item) => incidentMonthKey(item.createdAt) === monthFilter,
          )
        : incidents,
    [incidents, monthFilter],
  );
  const stats = incidentStats(scopedByMonth, now);

  const filtered = useMemo(
    () =>
      scopedByMonth
        .filter((item) => {
          if (filter === "open" && isComplete(item)) return false;
          if (filter === "pending" && item.status !== "pending") return false;
          if (filter === "assigned" && item.status !== "assigned") return false;
          if (filter === "in_progress" && item.status !== "in_progress")
            return false;
          if (filter === "overdue" && !isOverdue(item, now)) return false;
          if (filter === "completed" && !isComplete(item)) return false;
          if (category !== "all" && item.category !== category) return false;
          if (priorityFilter !== "all" && item.priority !== priorityFilter)
            return false;
          if (unitFilter === UNASSIGNED_UNIT_FILTER && item.assignedTo)
            return false;
          if (
            unitFilter !== "all" &&
            unitFilter !== UNASSIGNED_UNIT_FILTER &&
            item.assignedTo?.unitName !== unitFilter
          )
            return false;
          if (
            assigneeFilter !== "all" &&
            (item.assignedTo?.assigneeName || "") !== assigneeFilter
          )
            return false;
          const text =
            `${item.code} ${item.title} ${item.location.address}`.toLocaleLowerCase(
              "vi",
            );
          return text.includes(query.trim().toLocaleLowerCase("vi"));
        })
        .sort((a, b) => compareDispatchPriority(a, b, now)),
    [
      scopedByMonth,
      filter,
      category,
      priorityFilter,
      unitFilter,
      assigneeFilter,
      query,
      now,
    ],
  );

  // Giữ hồ sơ vừa phân công hiển thị biên nhận kể cả khi rời nhóm "Chờ phân công".
  const selectedInFilter = filtered.find(
    (item) => item.id === selectedIncidentId,
  );
  const selected =
    selectedInFilter ??
    (selectedIncidentId && justDispatched?.id === selectedIncidentId
      ? incidents.find((item) => item.id === selectedIncidentId)
      : undefined);

  const clearFilters = () => {
    setFilter("all");
    setCategory("all");
    setPriorityFilter("all");
    setUnitFilter("all");
    setMonthFilter("");
    setAssigneeFilter("all");
    setQuery("");
    setJustDispatched(null);
    setSearchParams({}, { replace: true });
  };

  const scrollDetailIntoView = (force = false) => {
    if (!force && window.innerWidth > 820) return;
    window.requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const mapParams = new URLSearchParams();
  mapParams.set("status", filter);
  if (category !== "all") mapParams.set("category", category);
  if (unitFilter !== "all") mapParams.set("unit", unitFilter);
  if (monthFilter) mapParams.set("month", monthFilter);
  if (priorityFilter === "urgent") mapParams.set("urgent", "1");
  if (query.trim()) mapParams.set("q", query.trim());
  const mapUrl = `/map?${mapParams.toString()}`;

  const metrics = [
    {
      id: "pending",
      label: "Chờ phân công",
      value: stats.pending,
      icon: ClipboardList,
      color: "amber",
    },
    {
      id: "assigned",
      label: "Đã giao",
      value: stats.assigned,
      icon: Send,
      color: "blue",
    },
    {
      id: "in_progress",
      label: "Đang xử lý",
      value: stats.inProgress,
      icon: Clock,
      color: "blue",
    },
    {
      id: "overdue",
      label: "Quá hạn",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "rose",
    },
    {
      id: "completed",
      label: "Đã xử lý",
      value: stats.completed,
      icon: CheckCircle2,
      color: "green",
    },
  ] as const;

  const isMobileDetail = mobileDetailOpen && !!selected;

  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Tiếp nhận & phân công</h2>
          <p>
            Phường Trấn Biên · {stats.total} hồ sơ
            {monthFilter ? ` (tháng ${monthFilter})` : " trong dữ liệu demo"}
          </p>
        </div>
        <div className="work-heading-links">
          <Link className="work-secondary" to={mapUrl}>
            <Map size={16} aria-hidden="true" />
            Xem trên bản đồ
          </Link>
          <Link className="work-text-link" to="/statistics">
            Xem thống kê <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div
        className="work-metrics work-metrics-5"
        aria-label="Lọc theo nhóm trạng thái"
      >
        {metrics.map(({ id, label, value, icon: Icon, color }) => (
          <button
            type="button"
            key={id}
            aria-pressed={filter === id}
            className={`work-metric ${filter === id ? "active" : ""}`}
            onClick={() => {
              setFilter(id);
              setJustDispatched(null);
            }}
          >
            <span className={`metric-symbol ${color}`}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <span>
              <span className="metric-label">{label}</span>
              <strong>{value}</strong>
            </span>
          </button>
        ))}
      </div>

      {syncNotice && (
        <div className="work-notice" role="status">
          <span>{syncNotice} Danh sách điều phối đã đồng bộ.</span>
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setSelectedIncidentId(incidents[0]?.id || null);
            }}
          >
            Xem hồ sơ mới nhất <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {justDispatched && (
        <div className="work-success work-dispatch-banner" role="status">
          <span>
            {justDispatched.isReassignment
              ? "Đã điều chỉnh phân công"
              : "Đã giao"}{" "}
            <strong>{justDispatched.code}</strong> →{" "}
            <strong>{justDispatched.unitName}</strong> (
            {justDispatched.assigneeName} · hạn{" "}
            {formatDate(justDispatched.deadline)}).
          </span>
          <Link
            className="work-text-link"
            to={`/field/tasks?id=${encodeURIComponent(justDispatched.id)}`}
          >
            Mở nhiệm vụ hiện trường{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}

      <section
        className="work-surface"
        aria-label="Danh sách tiếp nhận và điều phối"
      >
        <div className="work-toolbar">
          <label className="work-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Tìm mã hoặc địa chỉ phản ánh"
              placeholder="Tìm mã hồ sơ, tên đường…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setJustDispatched(null);
              }}
            />
          </label>
          <select
            id="work-category"
            aria-label="Lọc loại sự cố"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as IncidentCategory | "all");
              setJustDispatched(null);
            }}
          >
            <option value="all">Tất cả loại sự cố</option>
            {Object.entries(CATEGORIES).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc mức độ"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as IncidentPriority | "all");
              setJustDispatched(null);
            }}
          >
            <option value="all">Tất cả mức độ</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Ưu tiên cao</option>
            <option value="normal">Bình thường</option>
          </select>
          <select
            aria-label="Lọc đơn vị phụ trách"
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setJustDispatched(null);
            }}
          >
            <option value="all">Tất cả đơn vị</option>
            <option value={UNASSIGNED_UNIT_FILTER}>Chưa giao đơn vị</option>
            {unitOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {monthFilter && (
            <button
              type="button"
              className="work-secondary"
              onClick={() => setMonthFilter("")}
            >
              Tháng {monthFilter} <X size={15} aria-hidden="true" />
            </button>
          )}
          {assigneeFilter !== "all" && (
            <button
              type="button"
              className="work-secondary"
              onClick={() => setAssigneeFilter("all")}
            >
              Phụ trách: {assigneeFilter} <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="work-list-toolbar">
          <div className="work-tabs">
            <button
              type="button"
              aria-pressed={filter === "open"}
              onClick={() => {
                setFilter("open");
                setJustDispatched(null);
              }}
            >
              Chưa hoàn tất
            </button>
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => {
                setFilter("all");
                setJustDispatched(null);
              }}
            >
              Tất cả hồ sơ
            </button>
            {!["open", "all"].includes(filter) && (
              <span className="work-active-filter">
                {metrics.find((i) => i.id === filter)?.label}
              </span>
            )}
          </div>
          <span className="work-count">
            {filtered.length}/{stats.total} hồ sơ
          </span>
        </div>

        <div className="dispatch-split">
          <div
            className={`work-list ${isMobileDetail ? "mobile-hidden" : ""}`}
          >
            {selected && !isMobileDetail && (
              <div className="mobile-selected-strip">
                <span>
                  Đang chọn: <strong>{selected.code}</strong>
                </span>
                <button
                  type="button"
                  className="work-secondary"
                  onClick={() => {
                    setMobileDetailOpen(true);
                    scrollDetailIntoView();
                  }}
                >
                  Mở chi tiết
                </button>
              </div>
            )}
            <p className="work-list-hint">
              Sắp xếp: Quá hạn trước → Khẩn cấp → Ưu tiên cao → Tiếp nhận mới
              nhất
            </p>
            {filtered.length ? (
              filtered.map((item) => {
                const visual = getIncidentMapVisual(item, now);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`work-incident ${selected?.id === item.id ? "selected" : ""}`}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => {
                      setSelectedIncidentId(item.id);
                      setJustDispatched(null);
                      setMobileDetailOpen(true);
                      scrollDetailIntoView();
                    }}
                  >
                    <span className="work-incident-top">
                      <span className="work-code">{item.code}</span>
                      <span
                        className={`work-badge ${
                          visual.key === "completed"
                            ? "green"
                            : visual.key === "urgent_overdue"
                              ? "rose"
                              : visual.key === "pending"
                                ? "amber"
                                : "blue"
                        }`}
                      >
                        <span aria-hidden="true">{visual.symbol}</span>{" "}
                        {STATUS_LABELS[item.status]}
                      </span>
                    </span>
                    <strong>{item.title}</strong>
                    <span className="work-address">
                      <MapPin size={15} aria-hidden="true" />
                      <span>{item.location.address}</span>
                    </span>
                    <span className="work-dispatch-row-meta">
                      {item.assignedTo
                        ? `${item.assignedTo.unitName} · ${getAssigneeLabel(item.assignedTo)}`
                        : "Chưa giao đơn vị"}
                    </span>
                    <span className="work-incident-bottom">
                      <span
                        className={isOverdue(item, now) ? "overdue-text" : ""}
                      >
                        <Clock size={14} aria-hidden="true" />
                        {deadlineLabel(item, now)}
                      </span>
                      <span
                        className={
                          item.priority === "urgent" ? "overdue-text" : ""
                        }
                      >
                        {CATEGORIES[item.category]} ·{" "}
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="work-empty">
                <Search size={28} aria-hidden="true" />
                <h3>Không có hồ sơ phù hợp</h3>
                <p>Thử tìm địa chỉ khác hoặc xóa bộ lọc đang áp dụng.</p>
                <button
                  type="button"
                  className="work-secondary"
                  onClick={clearFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          <div
            ref={detailSectionRef}
            className={`work-detail-panel ${!isMobileDetail ? "mobile-hidden" : ""}`}
          >
            {selected ? (
              <section className="work-detail" aria-label="Chi tiết phản ánh">
                <div className="work-detail-mobile-bar">
                  <button
                    type="button"
                    className="work-secondary"
                    onClick={() => setMobileDetailOpen(false)}
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Quay lại danh sách
                  </button>
                  <Link className="work-secondary" to="/map">
                    <Map size={16} aria-hidden="true" />
                    Bản đồ phản ánh
                  </Link>
                </div>
                <div className="work-detail-heading">
                  <div>
                    <span className="work-code">{selected.code}</span>
                    <h3>{selected.title}</h3>
                  </div>
                  <div className="work-detail-actions">
                    <Link
                      className="work-icon-button"
                      to={`/dispatch/${encodeURIComponent(selected.id)}?from=dashboard`}
                      aria-label="Mở trang chi tiết hồ sơ"
                      title="Mở trang chi tiết hồ sơ"
                    >
                      <ArrowUpRight size={19} aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      className="work-icon-button"
                      aria-label="Đóng chi tiết"
                      onClick={() => {
                        setSelectedIncidentId(null);
                        setMobileDetailOpen(false);
                        setJustDispatched(null);
                      }}
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <IncidentOverview incident={selected} now={now} />
                <IncidentDispatchForm
                  key={selected.id}
                  incident={selected}
                  onDone={(assigned) => setJustDispatched(assigned)}
                />
                <div className="supporting-location-map">
                  <OpenStreetMap
                    title="Vị trí hồ sơ đang xem"
                    center={[selected.location.lat, selected.location.lng]}
                    zoom={16}
                    singlePin={{
                      ...selected.location,
                      label: selected.location.address,
                    }}
                    height="220px"
                    expandable
                    showLocateButton={false}
                  />
                </div>
              </section>
            ) : (
              <div className="work-select-hint">
                <ClipboardList size={24} aria-hidden="true" />
                <div>
                  <h3>Chọn hồ sơ để xem chi tiết và phân công</h3>
                  <p>
                    Bấm một hồ sơ trong danh sách bên trái để xem ảnh, vị trí,
                    đơn vị phụ trách và thực hiện điều phối.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <p className="work-footer-note">
        Dữ liệu giả lập phục vụ bài thi · Danh sách đơn vị/cán bộ là dữ liệu
        minh họa · Đồng bộ giữa các tab cùng trình duyệt trên máy này.
      </p>
    </div>
  );
}
export const IocDashboardPage = () => <OfficerWorkbench />;

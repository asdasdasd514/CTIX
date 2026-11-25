import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  List,
  Map,
  ArrowUpRight,
  Clock,
  X,
  ClipboardList,
} from "lucide-react";
import {
  useIncidentStore,
  type AdminMapFilter,
} from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  UNASSIGNED_UNIT_FILTER,
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
import type { IncidentCategory } from "../../types/incident";

const VALID_FILTERS: AdminMapFilter[] = [
  "open",
  "all",
  "pending",
  "assigned",
  "in_progress",
  "overdue",
  "completed",
];

export function AdminMapPage() {
  const {
    incidents,
    syncNotice,
    selectedIncidentId,
    setSelectedIncidentId,
    mapScreenState,
    setMapScreenState,
    refreshIncidents,
  } = useIncidentStore();
  const { currentUser } = useAuthStore();
  const isFieldStaff = currentUser.role === "volunteer";

  useEffect(() => {
    void refreshIncidents();
  }, [refreshIncidents]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [now, setNow] = useState(() => Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);

  // Giữ nguyên góc nhìn bản đồ lần đầu khi quay lại từ trang phân công (tránh vòng lặp moveend -> setView).
  const [initialMapView] = useState(() => ({
    center: mapScreenState.center ?? undefined,
    zoom: mapScreenState.zoom ?? undefined,
  }));

  // Đồng bộ tham số URL (khi đi từ Thống kê hoặc Tiếp nhận & phân công sang bản đồ).
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const categoryParam = searchParams.get("category");
    const unitParam = searchParams.get("unit");
    const monthParam = searchParams.get("month");
    const urgentParam = searchParams.get("urgent");
    const queryParam = searchParams.get("q");
    if (
      statusParam ||
      categoryParam ||
      unitParam ||
      monthParam ||
      urgentParam ||
      queryParam
    ) {
      const patch: Partial<typeof mapScreenState> = {};
      if (statusParam && VALID_FILTERS.includes(statusParam as AdminMapFilter))
        patch.filter = statusParam as AdminMapFilter;
      if (
        categoryParam &&
        (categoryParam === "all" || Object.hasOwn(CATEGORIES, categoryParam))
      )
        patch.category = categoryParam as IncidentCategory | "all";
      if (unitParam) patch.unit = unitParam;
      if (monthParam !== null) patch.month = monthParam;
      if (urgentParam !== null) patch.urgentOnly = urgentParam === "1";
      if (queryParam !== null) patch.query = queryParam;
      setMapScreenState(patch);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setMapScreenState, setSearchParams]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { filter, category, query, urgentOnly, unit, month } = mapScreenState;
  const unitOptions = useMemo(() => getAllKnownUnits(incidents), [incidents]);
  const stats = incidentStats(incidents, now);

  const filtered = useMemo(
    () =>
      incidents
        .filter((item) => {
          // Tài khoản Tổ xử lý chỉ thấy các điểm được giao cho Tổ / cá nhân mình
          if (isFieldStaff) {
            if (item.status === "pending_review" || item.status === "rejected")
              return false;
            const myDept = (currentUser.department || "").trim().toLowerCase();
            const myName = (currentUser.name || "").trim().toLowerCase();
            const matchUnit =
              myDept &&
              item.assignedTo?.unitName &&
              item.assignedTo.unitName.trim().toLowerCase() === myDept;
            const matchAssignee =
              myName &&
              item.assignedTo?.assigneeName &&
              item.assignedTo.assigneeName.trim().toLowerCase() === myName;
            if (!matchUnit && !matchAssignee) return false;
          }
          if (month && incidentMonthKey(item.createdAt) !== month) return false;
          if (
            filter === "open" &&
            (isComplete(item) ||
              item.status === "rejected" ||
              item.status === "pending_review")
          )
            return false;
          if (filter === "pending" && item.status !== "pending") return false;
          if (filter === "assigned" && item.status !== "assigned") return false;
          if (filter === "in_progress" && item.status !== "in_progress")
            return false;
          if (filter === "overdue" && !isOverdue(item, now)) return false;
          if (filter === "completed" && !isComplete(item)) return false;
          if (category !== "all" && item.category !== category) return false;
          if (urgentOnly && (isComplete(item) || item.priority !== "urgent"))
            return false;
          if (unit === UNASSIGNED_UNIT_FILTER && item.assignedTo) return false;
          if (
            unit !== "all" &&
            unit !== UNASSIGNED_UNIT_FILTER &&
            item.assignedTo?.unitName !== unit
          )
            return false;
          const text =
            `${item.code} ${item.title} ${item.location.address}`.toLocaleLowerCase(
              "vi",
            );
          return text.includes(query.trim().toLocaleLowerCase("vi"));
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [incidents, filter, category, query, urgentOnly, unit, month, now],
  );

  const selected = filtered.find((item) => item.id === selectedIncidentId);
  const selectedVisual = selected
    ? getIncidentMapVisual(selected, now)
    : undefined;

  const clearFilters = useCallback(() => {
    setMapScreenState({
      filter: "all",
      category: "all",
      query: "",
      urgentOnly: false,
      unit: "all",
      month: "",
    });
  }, [setMapScreenState]);

  const handleViewChange = useCallback(
    (center: [number, number], zoom: number) => {
      setMapScreenState({ center, zoom });
    },
    [setMapScreenState],
  );

  const dispatchListParams = new URLSearchParams();
  if (filter !== "open") dispatchListParams.set("status", filter);
  if (category !== "all") dispatchListParams.set("category", category);
  if (unit !== "all") dispatchListParams.set("unit", unit);
  if (month) dispatchListParams.set("month", month);
  if (urgentOnly) dispatchListParams.set("urgent", "1");
  if (query.trim()) dispatchListParams.set("q", query.trim());
  const dispatchListUrl = isFieldStaff
    ? "/admin/field-tasks"
    : dispatchListParams.toString()
      ? `/admin/inbox?${dispatchListParams.toString()}`
      : "/admin/inbox";

  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Bản đồ phản ánh hiện trường</h2>
          <p>
            Phường Trấn Biên · {filtered.length}/{stats.total} vị trí đang hiển
            thị
            {month ? ` · Tháng ${month}` : ""}
          </p>
        </div>
        <Link className="work-text-link" to={dispatchListUrl}>
          Mở Tiếp nhận & phân công <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {syncNotice && (
        <div className="work-notice" role="status">
          <span>{syncNotice} Ghim bản đồ đã đồng bộ (giữ nguyên góc nhìn).</span>
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

      <section className="work-surface" aria-label="Bộ lọc và bản đồ phản ánh">
        <div className="work-toolbar">
          <label className="work-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Tìm mã hoặc địa chỉ trên bản đồ"
              placeholder="Tìm mã hồ sơ, tên đường…"
              value={query}
              onChange={(e) => setMapScreenState({ query: e.target.value })}
            />
          </label>
          <select
            aria-label="Lọc tình trạng trên bản đồ"
            value={filter}
            onChange={(e) =>
              setMapScreenState({ filter: e.target.value as AdminMapFilter })
            }
          >
            <option value="open">Chưa hoàn tất ({stats.pending + stats.active})</option>
            <option value="pending">Chờ phân công ({stats.pending})</option>
            <option value="assigned">Đã giao ({stats.assigned})</option>
            <option value="in_progress">Đang xử lý ({stats.inProgress})</option>
            <option value="overdue">Quá hạn ({stats.overdue})</option>
            <option value="completed">Đã xử lý ({stats.completed})</option>
            <option value="all">Tất cả hồ sơ ({stats.total})</option>
          </select>
          <select
            aria-label="Lọc loại sự cố trên bản đồ"
            value={category}
            onChange={(e) =>
              setMapScreenState({
                category: e.target.value as IncidentCategory | "all",
              })
            }
          >
            <option value="all">Tất cả loại sự cố</option>
            {Object.entries(CATEGORIES).map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc đơn vị trên bản đồ"
            value={unit}
            onChange={(e) => setMapScreenState({ unit: e.target.value })}
          >
            <option value="all">Tất cả đơn vị</option>
            <option value={UNASSIGNED_UNIT_FILTER}>Chưa giao đơn vị</option>
            {unitOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <label className="urgent-filter">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) =>
                setMapScreenState({ urgentOnly: e.target.checked })
              }
            />
            Chỉ khẩn cấp
          </label>
          {month && (
            <button
              type="button"
              className="work-secondary"
              onClick={() => setMapScreenState({ month: "" })}
            >
              Tháng {month} <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          className="work-mobile-view"
          role="group"
          aria-label="Chuyển giữa bản đồ và danh sách tóm tắt"
        >
          <button
            type="button"
            aria-pressed={mobileView === "map"}
            onClick={() => setMobileView("map")}
          >
            <Map size={18} aria-hidden="true" />
            Bản đồ ({filtered.length})
          </button>
          <button
            type="button"
            aria-pressed={mobileView === "list"}
            onClick={() => setMobileView("list")}
          >
            <List size={18} aria-hidden="true" />
            Danh sách tóm tắt
          </button>
        </div>

        <div className="map-primary-layout">
          <div
            className={`map-primary-stage ${mobileView !== "map" ? "mobile-hidden" : ""}`}
          >
            <OpenStreetMap
              title={`Bản đồ phản ánh · ${filtered.length} vị trí`}
              incidents={filtered}
              center={initialMapView.center}
              zoom={initialMapView.zoom}
              height="480px"
              now={now}
              expandable
              showLegend
              selectedId={selected?.id}
              emptyMessage="Không có ghim phù hợp bộ lọc hiện tại. Thử xóa bộ lọc để xem lại."
              onClearFilters={clearFilters}
              onViewChange={handleViewChange}
              onMarkerClick={(item) => setSelectedIncidentId(item.id)}
              onOpenDetail={(item) => {
                setSelectedIncidentId(item.id);
                window.requestAnimationFrame(() =>
                  summaryRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                  }),
                );
              }}
            />

            <div ref={summaryRef} className="map-selected-card">
              {selected && selectedVisual ? (
                <section
                  className="work-detail map-summary-detail"
                  aria-label="Tóm tắt hồ sơ đang chọn trên bản đồ"
                >
                  <div className="work-detail-heading">
                    <div>
                      <span className="work-code">{selected.code}</span>
                      <h3>{selected.title}</h3>
                    </div>
                    <button
                      type="button"
                      className="work-icon-button"
                      aria-label="Bỏ chọn hồ sơ"
                      onClick={() => setSelectedIncidentId(null)}
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="overview-badges">
                    <span
                      className={`work-badge status-chip status-${selectedVisual.key}`}
                      style={{
                        borderColor: selectedVisual.color,
                        color: selectedVisual.color,
                      }}
                    >
                      <span aria-hidden="true">{selectedVisual.symbol}</span>{" "}
                      {STATUS_LABELS[selected.status]}
                    </span>
                    <span className="work-badge neutral">
                      {CATEGORIES[selected.category]}
                    </span>
                    <span
                      className={`work-badge ${
                        selected.priority === "urgent"
                          ? "rose"
                          : selected.priority === "high"
                            ? "amber"
                            : "neutral"
                      }`}
                    >
                      {PRIORITY_LABELS[selected.priority]}
                    </span>
                    {isOverdue(selected, now) && (
                      <span className="work-badge rose">! Quá hạn</span>
                    )}
                  </div>

                  <div className="map-summary-body">
                    {selected.photosBefore[0] && (
                      <img
                        className="map-summary-thumb"
                        src={selected.photosBefore[0]}
                        alt="Ảnh hiện trường"
                      />
                    )}
                    <div className="map-summary-info">
                      <p className="work-address">
                        <MapPin size={15} aria-hidden="true" />
                        <span>{selected.location.address}</span>
                      </p>
                      <p className="work-help">
                        <Clock size={14} aria-hidden="true" />{" "}
                        {selected.assignedTo
                          ? `Hạn: ${formatDate(selected.assignedTo.deadline)} (${deadlineLabel(selected, now)})`
                          : "Chưa đặt hạn xử lý"}
                      </p>
                      {selected.assignedTo && (
                        <p className="work-help">
                          Đơn vị: <strong>{selected.assignedTo.unitName}</strong>{" "}
                          · Phụ trách:{" "}
                          <strong>{getAssigneeLabel(selected.assignedTo)}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="map-summary-actions">
                    {selected.status === "pending" ? (
                      <Link
                        className="work-primary"
                        to={`/dispatch/${encodeURIComponent(selected.id)}?from=map`}
                      >
                        Phân công xử lý{" "}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    ) : (
                      <>
                        <Link
                          className="work-primary"
                          to={`/field/tasks?id=${encodeURIComponent(selected.id)}`}
                        >
                          Xem nhiệm vụ{" "}
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                        <Link
                          className="work-secondary"
                          to={`/dispatch/${encodeURIComponent(selected.id)}?from=map`}
                        >
                          Chi tiết hồ sơ
                        </Link>
                      </>
                    )}
                  </div>
                </section>
              ) : (
                <div className="work-select-hint">
                  <ClipboardList size={22} aria-hidden="true" />
                  <div>
                    <h3>Chạm ghim trên bản đồ để xem nhanh hồ sơ</h3>
                    <p>
                      Xem ảnh, địa chỉ, mức độ, hạn xử lý và chuyển sang phân
                      công hoặc theo dõi nhiệm vụ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside
            className={`map-compact-list ${mobileView !== "list" ? "mobile-hidden" : ""}`}
            aria-label="Danh sách tóm tắt theo bộ lọc bản đồ"
          >
            <p className="work-list-hint">
              Danh sách tóm tắt ({filtered.length}) · Quá hạn & khẩn cấp lên đầu
            </p>
            {filtered.length ? (
              filtered.map((item) => {
                const visual = getIncidentMapVisual(item, now);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`work-incident compact-row ${selected?.id === item.id ? "selected" : ""}`}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => {
                      setSelectedIncidentId(item.id);
                      setMobileView("map");
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
                      <MapPin size={14} aria-hidden="true" />
                      <span>{item.location.address}</span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="work-empty">
                <Search size={24} aria-hidden="true" />
                <h3>Không có hồ sơ phù hợp</h3>
                <button
                  type="button"
                  className="work-secondary"
                  onClick={clearFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
      <p className="work-footer-note">
        Dữ liệu giả lập phục vụ bài thi · Đồng bộ giữa các tab cùng trình duyệt
        trên máy này.
      </p>
    </div>
  );
}

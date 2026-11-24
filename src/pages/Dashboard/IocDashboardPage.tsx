import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  List,
  Map,
  ArrowUpRight,
  ArrowLeft,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  IncidentDispatchForm,
  IncidentOverview,
} from "../../components/Incidents/IncidentDispatchForm";
import {
  CATEGORIES,
  STATUS_LABELS,
  deadlineLabel,
  formatDate,
  getIncidentMapVisual,
  incidentStats,
  isComplete,
  isOverdue,
} from "../../lib/incidents";
import type { IncidentCategory } from "../../types/incident";

type WorkFilter =
  | "open"
  | "all"
  | "pending"
  | "active"
  | "overdue"
  | "completed";

export function OfficerWorkbench({
  initialView = "list",
}: {
  initialView?: "list" | "map";
}) {
  const { incidents, syncNotice, selectedIncidentId, setSelectedIncidentId } =
    useIncidentStore();
  const [filter, setFilter] = useState<WorkFilter>("open");
  const [category, setCategory] = useState<IncidentCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [viewState, setViewState] = useState({
    base: initialView,
    current: initialView,
  });
  const view = viewState.base === initialView ? viewState.current : initialView;
  const setView = (next: "list" | "map") =>
    setViewState({ base: initialView, current: next });
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [justDispatched, setJustDispatched] = useState<{
    id: string;
    code: string;
    unitName: string;
    deadline: string;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const detailSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = incidentStats(incidents, now);
  const filtered = useMemo(
    () =>
      incidents
        .filter((item) => {
          if (filter === "open" && isComplete(item)) return false;
          if (filter === "pending" && item.status !== "pending") return false;
          if (
            filter === "active" &&
            item.status !== "assigned" &&
            item.status !== "in_progress"
          )
            return false;
          if (filter === "overdue" && !isOverdue(item, now)) return false;
          if (filter === "completed" && !isComplete(item)) return false;
          if (category !== "all" && item.category !== category) return false;
          if (urgentOnly && (isComplete(item) || item.priority !== "urgent"))
            return false;
          const text =
            `${item.code} ${item.title} ${item.location.address}`.toLocaleLowerCase(
              "vi",
            );
          return text.includes(query.trim().toLocaleLowerCase("vi"));
        })
        .sort(
          (a, b) =>
            Number(isOverdue(b, now)) - Number(isOverdue(a, now)) ||
            Number(b.priority === "urgent") - Number(a.priority === "urgent") ||
            Date.parse(b.createdAt) - Date.parse(a.createdAt),
        ),
    [incidents, filter, category, query, urgentOnly, now],
  );

  // Giữ hồ sơ vừa phân công hiển thị kết quả lưu kể cả khi đang lọc "Chờ phân công".
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
    setQuery("");
    setUrgentOnly(false);
    setJustDispatched(null);
  };

  const scrollDetailIntoView = () => {
    window.requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const metrics = [
    {
      id: "pending",
      label: "Chờ phân công",
      value: stats.pending,
      icon: ClipboardList,
      color: "amber",
    },
    {
      id: "active",
      label: "Đang xử lý",
      value: stats.active,
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

  const isMobileListDetail = view === "list" && mobileDetailOpen && !!selected;

  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Việc cần xử lý</h2>
          <p>Phường Trấn Biên · {stats.total} phản ánh trong dữ liệu demo</p>
        </div>
        <Link className="work-text-link" to="/statistics">
          Xem thống kê <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="work-metrics" aria-label="Lọc theo tình trạng hồ sơ">
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
              <Icon size={19} aria-hidden="true" />
            </span>
            <span>
              <span className="metric-label">{label}</span>
              <strong>{value}</strong>
            </span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
      {syncNotice && (
        <div className="work-notice" role="status">
          <span>{syncNotice} Bản đồ và danh sách đã đồng bộ.</span>
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
            Đã giao <strong>{justDispatched.code}</strong> cho{" "}
            <strong>{justDispatched.unitName}</strong> (hạn{" "}
            {formatDate(justDispatched.deadline)}).
          </span>
          <Link className="work-text-link" to="/field/tasks">
            Mở nhiệm vụ hiện trường{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
      <section
        className="work-surface"
        aria-label="Tiếp nhận và điều phối phản ánh"
      >
        <div className="work-toolbar">
          <label className="work-search">
            <Search size={18} aria-hidden="true" />
            <input
              aria-label="Tìm phản ánh"
              placeholder="Tìm mã phản ánh, tên đường…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setJustDispatched(null);
              }}
            />
          </label>
          <label className="sr-only" htmlFor="work-category">
            Loại sự cố
          </label>
          <select
            id="work-category"
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
          <label className="urgent-filter">
            <input
              type="checkbox"
              checked={urgentOnly}
              onChange={(e) => {
                setUrgentOnly(e.target.checked);
                setJustDispatched(null);
              }}
            />
            Chỉ khẩn cấp
          </label>
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
        <div
          className="work-mobile-view"
          role="group"
          aria-label="Chuyển chế độ xem danh sách hoặc bản đồ"
        >
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => {
              setView("list");
              setMobileDetailOpen(false);
            }}
          >
            <List size={18} aria-hidden="true" />
            Danh sách ({filtered.length})
          </button>
          <button
            type="button"
            aria-pressed={view === "map"}
            onClick={() => {
              setView("map");
              setMobileDetailOpen(false);
            }}
          >
            <Map size={18} aria-hidden="true" />
            Bản đồ
          </button>
        </div>
        <div className="work-split">
          <div
            className={`work-list ${view !== "list" || isMobileListDetail ? "mobile-hidden" : ""}`}
          >
            {selected && !isMobileListDetail && (
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
            <p className="work-list-hint">Ưu tiên quá hạn và khẩn cấp trước</p>
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
                        className={`work-badge ${isComplete(item) ? "green" : item.status === "pending" ? "amber" : "blue"}`}
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
                    <span className="work-incident-bottom">
                      <span
                        className={isOverdue(item, now) ? "overdue-text" : ""}
                      >
                        <Clock size={14} aria-hidden="true" />
                        {deadlineLabel(item, now)}
                      </span>
                      {item.priority === "urgent" ? (
                        <span className="overdue-text">! Khẩn cấp</span>
                      ) : (
                        <span>{CATEGORIES[item.category]}</span>
                      )}
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
            className={`work-map-panel ${view !== "map" ? "mobile-hidden" : ""}`}
          >
            <OpenStreetMap
              title={`Bản đồ hiện trường · ${filtered.length} vị trí`}
              incidents={filtered}
              height="360px"
              now={now}
              expandable
              showLegend
              selectedId={selectedInFilter?.id}
              emptyMessage="Thử từ khóa khác hoặc xóa bộ lọc để xem các vị trí phản ánh."
              onClearFilters={clearFilters}
              onMarkerClick={(item) => {
                setSelectedIncidentId(item.id);
                setJustDispatched(null);
              }}
              onOpenDetail={(item) => {
                setSelectedIncidentId(item.id);
                setJustDispatched(null);
                setMobileDetailOpen(true);
                scrollDetailIntoView();
              }}
            />
          </div>

          <div
            ref={detailSectionRef}
            className={`work-detail-panel ${
              view === "list" && !isMobileListDetail ? "mobile-hidden" : ""
            }`}
          >
            {selected ? (
              <section className="work-detail" aria-label="Chi tiết phản ánh">
                <div className="work-detail-mobile-bar">
                  {view === "list" && (
                    <button
                      type="button"
                      className="work-secondary"
                      onClick={() => setMobileDetailOpen(false)}
                    >
                      <ArrowLeft size={16} aria-hidden="true" />
                      Quay lại danh sách
                    </button>
                  )}
                  {view === "list" && (
                    <button
                      type="button"
                      className="work-secondary"
                      onClick={() => {
                        setView("map");
                        setMobileDetailOpen(false);
                      }}
                    >
                      <Map size={16} aria-hidden="true" />
                      Xem bản đồ
                    </button>
                  )}
                </div>
                <div className="work-detail-heading">
                  <div>
                    <span className="work-code">{selected.code}</span>
                    <h3>{selected.title}</h3>
                  </div>
                  <div className="work-detail-actions">
                    <Link
                      className="work-icon-button"
                      to={`/dispatch/${encodeURIComponent(selected.id)}`}
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
              </section>
            ) : (
              <div className="work-select-hint">
                <ClipboardList size={24} aria-hidden="true" />
                <div>
                  <h3>Chọn hồ sơ để xem và giao xử lý</h3>
                  <p>
                    Bấm một dòng trong danh sách hoặc chạm một ghim trên bản đồ.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <p className="work-footer-note">
        Dữ liệu giả lập phục vụ bài thi · Các đơn vị xử lý là nhóm minh họa ·
        Đồng bộ giữa các tab cùng trình duyệt trên máy này.
      </p>
    </div>
  );
}
export const IocDashboardPage = () => <OfficerWorkbench />;

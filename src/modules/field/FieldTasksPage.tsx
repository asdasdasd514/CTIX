import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  ClipboardCheck,
  Play,
  AlertTriangle,
  X,
  UserCheck,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useIncidentStore } from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import { IncidentResolutionModal } from "./IncidentResolutionModal";
import {
  CATEGORIES,
  STATUS_LABELS,
  UNASSIGNED_STAFF_LABEL,
  deadlineLabel,
  formatDate,
  getAllKnownAssignees,
  getAllKnownUnits,
  getAssigneeLabel,
  isComplete,
  isOverdue,
} from "../../lib/incidents";

type FieldTab = "assigned" | "verify" | "completed";

export function FieldTasksPage() {
  const { incidents, verifyIncident, startIncident } = useIncidentStore();
  const { currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedId = searchParams.get("id");
  const linkedIncident = linkedId
    ? incidents.find((i) => i.id === linkedId)
    : undefined;

  const [tabState, setTabState] = useState<{
    linked: string | null;
    current: FieldTab;
  }>({
    linked: linkedId,
    current: linkedIncident
      ? isComplete(linkedIncident)
        ? "completed"
        : linkedIncident.status === "pending"
          ? "verify"
          : "assigned"
      : "assigned",
  });
  const derivedLinkedTab: FieldTab = linkedIncident
    ? isComplete(linkedIncident)
      ? "completed"
      : linkedIncident.status === "pending"
        ? "verify"
        : "assigned"
    : "assigned";
  const tab =
    tabState.linked === linkedId ? tabState.current : derivedLinkedTab;
  const setTab = (next: FieldTab) =>
    setTabState({ linked: linkedId, current: next });

  const [unitFilter, setUnitFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const highlightedCardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!linkedIncident) return;
    window.requestAnimationFrame(() => {
      highlightedCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [linkedIncident]);

  const unitOptions = useMemo(() => getAllKnownUnits(incidents), [incidents]);
  const assigneeOptions = useMemo(
    () => getAllKnownAssignees(incidents),
    [incidents],
  );
  // Chỉ bật nhãn "Việc của tôi" khi dữ liệu thực sự có nhiệm vụ chỉ định trực tiếp cho người đang đăng nhập.
  const myTasksCount = useMemo(
    () =>
      incidents.filter(
        (i) => i.assignedTo?.assigneeName?.trim() === currentUser.name,
      ).length,
    [incidents, currentUser.name],
  );

  const matchesScope = (i: (typeof incidents)[number]) => {
    if (unitFilter !== "all" && i.assignedTo?.unitName !== unitFilter)
      return false;
    if (
      assigneeFilter === UNASSIGNED_STAFF_LABEL &&
      i.assignedTo?.assigneeName?.trim()
    )
      return false;
    if (
      assigneeFilter !== "all" &&
      assigneeFilter !== UNASSIGNED_STAFF_LABEL &&
      i.assignedTo?.assigneeName?.trim() !== assigneeFilter
    )
      return false;
    if (
      mineOnly &&
      myTasksCount > 0 &&
      i.assignedTo?.assigneeName?.trim() !== currentUser.name
    )
      return false;
    return true;
  };

  const groups = {
    assigned: incidents.filter(
      (i) =>
        (i.status === "assigned" || i.status === "in_progress") &&
        matchesScope(i),
    ),
    verify: incidents.filter(
      (i) => !isComplete(i) && !i.verifiedByVolunteer && matchesScope(i),
    ),
    completed: incidents.filter((i) => isComplete(i) && matchesScope(i)),
  };

  const target = incidents.find((i) => i.id === resolveId);
  const act = (action: () => void, text: string) => {
    setError("");
    try {
      action();
      setMessage(text);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Nhiệm vụ hiện trường</h2>
          <p>Xác minh tại chỗ, nhận việc và cập nhật ảnh sau xử lý</p>
        </div>
        <div className="work-heading-links">
          <Link className="work-text-link" to="/map">
            Bản đồ phản ánh
          </Link>
          <Link className="work-text-link" to="/dashboard">
            Tiếp nhận & phân công →
          </Link>
        </div>
      </div>

      {linkedId && !linkedIncident && (
        <div className="work-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" /> Không tìm thấy nhiệm vụ
          theo mã đường dẫn này. Hệ thống không tự mở nhiệm vụ khác.{" "}
          <button
            type="button"
            className="work-text-link"
            onClick={() => setSearchParams({}, { replace: true })}
          >
            Xem toàn bộ nhiệm vụ
          </button>
        </div>
      )}

      {linkedIncident && (
        <div className="work-notice" role="status">
          <span>
            Đang mở đúng nhiệm vụ <strong>{linkedIncident.code}</strong> —{" "}
            {linkedIncident.title}
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({}, { replace: true })}
          >
            Bỏ đánh dấu <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="work-surface">
        <div className="work-toolbar">
          <select
            aria-label="Lọc nhiệm vụ theo đơn vị"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
          >
            <option value="all">Tất cả đơn vị</option>
            {unitOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc nhiệm vụ theo người phụ trách"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="all">Tất cả người phụ trách</option>
            <option value={UNASSIGNED_STAFF_LABEL}>
              {UNASSIGNED_STAFF_LABEL}
            </option>
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {myTasksCount > 0 && (
            <button
              type="button"
              className={mineOnly ? "work-primary" : "work-secondary"}
              aria-pressed={mineOnly}
              onClick={() => setMineOnly((v) => !v)}
            >
              <UserCheck size={16} aria-hidden="true" />
              Việc của tôi ({myTasksCount})
            </button>
          )}
        </div>
        <div className="work-list-toolbar">
          <div className="work-tabs">
            <button
              type="button"
              aria-pressed={tab === "assigned"}
              onClick={() => setTab("assigned")}
            >
              Cần xử lý ({groups.assigned.length})
            </button>
            <button
              type="button"
              aria-pressed={tab === "verify"}
              onClick={() => setTab("verify")}
            >
              Cần xác minh ({groups.verify.length})
            </button>
            <button
              type="button"
              aria-pressed={tab === "completed"}
              onClick={() => setTab("completed")}
            >
              Đã xử lý ({groups.completed.length})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <p className="work-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="work-error" role="alert">
          {error}
        </p>
      )}
      <p className="work-help">
        {myTasksCount > 0
          ? `Có ${myTasksCount} nhiệm vụ chỉ định cho ${currentUser.name}. `
          : `Hiện chưa có nhiệm vụ nào chỉ định riêng cho ${currentUser.name}; đang hiển thị nhiệm vụ theo đơn vị trên địa bàn. `}
        Xác minh là thông tin bổ sung, không tự thay thế bước nhận việc.
      </p>

      <div className="field-grid">
        {groups[tab]
          .sort(
            (a, b) =>
              Number(b.id === linkedId) - Number(a.id === linkedId) ||
              Number(isOverdue(b)) - Number(isOverdue(a)) ||
              Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
          )
          .map((item) => {
            const isHighlighted = item.id === linkedId;
            return (
              <article
                ref={isHighlighted ? highlightedCardRef : undefined}
                className={`work-surface field-task ${isHighlighted ? "is-highlighted" : ""}`}
                key={item.id}
              >
                <div className="work-incident-top">
                  <span className="work-code">{item.code}</span>
                  <span
                    className={`work-badge ${isComplete(item) ? "green" : isOverdue(item) ? "rose" : "blue"}`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p className="work-address">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{item.location.address}</span>
                </p>
                <p className="work-help">
                  {CATEGORIES[item.category]} ·{" "}
                  {item.verifiedByVolunteer ? "Đã xác minh" : "Chưa xác minh"}
                </p>
                {item.assignedTo && (
                  <div className="work-assignment">
                    <strong>{item.assignedTo.unitName}</strong>
                    <span>
                      Người phụ trách:{" "}
                      <strong>{getAssigneeLabel(item.assignedTo)}</strong>
                    </span>
                    <span className={isOverdue(item) ? "overdue-text" : ""}>
                      {deadlineLabel(item)} ·{" "}
                      {formatDate(item.assignedTo.deadline)}
                    </span>
                    {item.assignedTo.notes && <p>{item.assignedTo.notes}</p>}
                  </div>
                )}
                {item.verificationNotes && (
                  <p className="work-help">
                    Xác minh: {item.verificationNotes}
                  </p>
                )}
                {item.resolution && (
                  <p className="work-help">Kết quả: {item.resolution.notes}</p>
                )}
                <div className="field-actions">
                  {!isComplete(item) && !item.verifiedByVolunteer && (
                    <button
                      type="button"
                      className="work-secondary"
                      onClick={() => {
                        setVerifyId(verifyId === item.id ? null : item.id);
                        setNotes("");
                      }}
                    >
                      <ClipboardCheck size={16} aria-hidden="true" />
                      Xác minh
                    </button>
                  )}
                  {item.status === "assigned" && (
                    <button
                      type="button"
                      className="work-primary"
                      onClick={() =>
                        act(
                          () => startIncident(item.id),
                          "Đã nhận việc. Trạng thái mới đã đồng bộ đến bản đồ, danh sách và thống kê.",
                        )
                      }
                    >
                      <Play size={15} aria-hidden="true" />
                      Nhận và bắt đầu
                    </button>
                  )}
                  {item.status === "in_progress" && (
                    <button
                      type="button"
                      className="work-primary"
                      onClick={() => setResolveId(item.id)}
                    >
                      <Camera size={16} aria-hidden="true" />
                      Cập nhật kết quả
                    </button>
                  )}
                  {isComplete(item) && (
                    <span className="work-text-link">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Đã công khai kết quả
                    </span>
                  )}
                </div>
                {verifyId === item.id && !isComplete(item) && (
                  <form
                    className="dispatch-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      act(() => {
                        verifyIncident(item.id, notes);
                        setVerifyId(null);
                      }, "Đã lưu xác minh tại chỗ.");
                    }}
                  >
                    <label>
                      Kết quả xác minh
                      <textarea
                        autoFocus
                        required
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Mô tả tình trạng thực tế đã kiểm tra…"
                        rows={3}
                      />
                    </label>
                    <button className="work-primary" type="submit">
                      Lưu xác minh
                    </button>
                  </form>
                )}
              </article>
            );
          })}
      </div>
      {!groups[tab].length && (
        <div className="work-empty">
          <CheckCircle2 size={32} aria-hidden="true" />
          <h3>Không có nhiệm vụ phù hợp</h3>
          <p>Thử đổi bộ lọc đơn vị/người phụ trách hoặc chờ nhiệm vụ mới.</p>
          {(unitFilter !== "all" || assigneeFilter !== "all" || mineOnly) && (
            <button
              type="button"
              className="work-secondary"
              onClick={() => {
                setUnitFilter("all");
                setAssigneeFilter("all");
                setMineOnly(false);
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
      {target && (
        <IncidentResolutionModal
          key={target.id}
          incident={target}
          onClose={() => setResolveId(null)}
        />
      )}
    </div>
  );
}

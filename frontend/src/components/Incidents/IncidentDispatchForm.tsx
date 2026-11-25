import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type {
  Incident,
  IncidentCategory,
  IncidentPriority,
} from "../../types/incident";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  UNITS,
  UNASSIGNED_STAFF_LABEL,
  deadlineLabel,
  formatDate,
  getAllKnownUnits,
  getAssigneeLabel,
  getIncidentMapVisual,
  getUnitStaff,
  isOverdue,
  isStaffInUnit,
  validateDispatchInput,
} from "../../lib/incidents";
import { useIncidentStore } from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import { BeforeAfterSlider } from "../common/BeforeAfterSlider";
import {
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Send,
  AlertTriangle,
  History,
  Pencil,
} from "lucide-react";

function localDateTime(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function IncidentOverview({
  incident,
  now,
}: {
  incident: Incident;
  now?: number;
}) {
  const [fallbackNow] = useState(() => Date.now());
  const referenceNow = now ?? fallbackNow;
  const visual = getIncidentMapVisual(incident, referenceNow);
  const overdue = isOverdue(incident, referenceNow);
  return (
    <div className="incident-overview">
      <div className="overview-badges">
        <span
          className={`work-badge status-chip status-${visual.key}`}
          style={{ borderColor: visual.color, color: visual.color }}
        >
          <span aria-hidden="true">{visual.symbol}</span>{" "}
          {STATUS_LABELS[incident.status]}
        </span>
        <span className="work-badge neutral">
          Loại: {CATEGORIES[incident.category]}
        </span>
        <span
          className={`work-badge ${
            incident.priority === "urgent"
              ? "rose"
              : incident.priority === "high"
                ? "amber"
                : "neutral"
          }`}
        >
          Mức độ: {PRIORITY_LABELS[incident.priority]}
        </span>
        {overdue && <span className="work-badge rose">! Quá hạn</span>}
      </div>

      <p className="overview-description">{incident.description}</p>

      <div className="overview-location">
        <MapPin size={16} aria-hidden="true" />
        <div>
          <strong>{incident.location.address}</strong>
          <span>
            Tọa độ: {incident.location.lat.toFixed(5)},{" "}
            {incident.location.lng.toFixed(5)}
          </span>
        </div>
      </div>

      {incident.photosBefore.length > 0 &&
      incident.photosAfter &&
      incident.photosAfter.length > 0 ? (
        <div className="space-y-3">
          <BeforeAfterSlider
            photosBefore={incident.photosBefore}
            photosAfter={incident.photosAfter}
          />
          <div className="work-evidence">
            <dl>
              <div>
                <dt>Tiếp nhận</dt>
                <dd>{formatDate(incident.createdAt)}</dd>
              </div>
              <div>
                <dt>Đồng phản ánh</dt>
                <dd>{incident.sameReportsCount} lượt</dd>
              </div>
              <div>
                <dt>Xác minh tại chỗ</dt>
                <dd>
                  {incident.verifiedByVolunteer ? "Đã xác minh" : "Chưa xác minh"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="work-evidence">
          {incident.photosBefore[0] ? (
            <figure>
              <img
                src={incident.photosBefore[0]}
                alt="Ảnh hiện trường trước xử lý"
              />
              <figcaption>Ảnh hiện trường trước xử lý</figcaption>
            </figure>
          ) : (
            <p className="work-help">Chưa có ảnh hiện trường.</p>
          )}
          {incident.photosAfter?.[0] && (
            <figure>
              <img
                src={incident.photosAfter[0]}
                alt="Ảnh hiện trường sau xử lý"
              />
              <figcaption>Ảnh sau xử lý</figcaption>
            </figure>
          )}
          <dl>
            <div>
              <dt>Tiếp nhận</dt>
              <dd>{formatDate(incident.createdAt)}</dd>
            </div>
            <div>
              <dt>Đồng phản ánh</dt>
              <dd>{incident.sameReportsCount} lượt</dd>
            </div>
            <div>
              <dt>Xác minh tại chỗ</dt>
              <dd>
                {incident.verifiedByVolunteer ? "Đã xác minh" : "Chưa xác minh"}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {incident.verificationNotes && (
        <p className="work-help">
          Ghi chú xác minh: {incident.verificationNotes}
        </p>
      )}
      {incident.assignedTo && (
        <div className="work-assignment">
          <span className="assignment-eyebrow">Thông tin phân công</span>
          <dl className="assignment-meta">
            <div>
              <dt>Đơn vị nhận nhiệm vụ</dt>
              <dd>{incident.assignedTo.unitName}</dd>
            </div>
            <div>
              <dt>Người phụ trách</dt>
              <dd>{getAssigneeLabel(incident.assignedTo)}</dd>
            </div>
            <div>
              <dt>Người phân công</dt>
              <dd>{incident.assignedTo.officerName || "Cán bộ tiếp nhận"}</dd>
            </div>
            <div>
              <dt>Hạn hoàn thành</dt>
              <dd className={overdue ? "overdue-text" : ""}>
                {formatDate(incident.assignedTo.deadline)} ·{" "}
                {deadlineLabel(incident, referenceNow)}
              </dd>
            </div>
          </dl>
          {incident.assignedTo.notes && (
            <p>Ghi chú giao việc: {incident.assignedTo.notes}</p>
          )}
        </div>
      )}
      {incident.assignmentHistory && incident.assignmentHistory.length > 0 && (
        <details className="assignment-history">
          <summary>
            <History size={15} aria-hidden="true" />
            Lịch sử điều chỉnh phân công ({incident.assignmentHistory.length})
          </summary>
          <ul>
            {incident.assignmentHistory.map((entry, idx) => (
              <li key={`${entry.changedAt}-${idx}`}>
                <strong>
                  {entry.changedBy} · {formatDate(entry.changedAt)}
                </strong>
                <p>Lý do: {entry.reason}</p>
                <span>
                  Trước: {entry.before.unitName} (
                  {entry.before.assigneeName || UNASSIGNED_STAFF_LABEL}) · Hạn{" "}
                  {formatDate(entry.before.deadline)}
                </span>
                <span>
                  Sau: {entry.after.unitName} (
                  {entry.after.assigneeName || UNASSIGNED_STAFF_LABEL}) · Hạn{" "}
                  {formatDate(entry.after.deadline)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {incident.resolution && (
        <p className="work-success">Kết quả xử lý: {incident.resolution.notes}</p>
      )}
      {incident.rating && (
        <p className="overview-rating">
          Đánh giá người dân: <strong>{incident.rating.stars}/5 sao</strong>
          {incident.rating.comment ? ` — “${incident.rating.comment}”` : ""}
        </p>
      )}
    </div>
  );
}

export interface DispatchReceipt {
  id: string;
  code: string;
  unitName: string;
  assigneeName: string;
  officerName: string;
  deadline: string;
  notes: string;
  isReassignment?: boolean;
}

export function IncidentDispatchForm({
  incident,
  onDone,
}: {
  incident: Incident;
  onDone?: (assigned: DispatchReceipt) => void;
}) {
  const incidents = useIncidentStore((s) => s.incidents);
  const assignIncident = useIncidentStore((s) => s.assignIncident);
  const reassignIncident = useIncidentStore((s) => s.reassignIncident);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isReassignable =
    incident.status === "assigned" || incident.status === "in_progress";

  const [editingAssignment, setEditingAssignment] = useState(false);
  const [category, setCategory] = useState(incident.category);
  const [unit, setUnit] = useState(
    incident.assignedTo?.unitName || UNITS[incident.category],
  );
  const [unitManuallyChosen, setUnitManuallyChosen] = useState(
    !!incident.assignedTo,
  );
  const [assignee, setAssignee] = useState(
    incident.assignedTo?.assigneeName || "",
  );
  const [unitChangeNotice, setUnitChangeNotice] = useState("");
  const [priority, setPriority] = useState(incident.priority);
  const [deadline, setDeadline] = useState(() =>
    localDateTime(
      incident.assignedTo
        ? new Date(
            Math.max(
              Date.parse(incident.assignedTo.deadline),
              Date.now() + 86400000,
            ),
          )
        : new Date(Date.now() + 3 * 86400000),
    ),
  );
  const [minimumDeadline] = useState(() => localDateTime(new Date()));
  const [notes, setNotes] = useState(incident.assignedTo?.notes || "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(incident.updatedAt);
  const [receipt, setReceipt] = useState<DispatchReceipt | null>(null);
  const submittingRef = useRef(false);

  const unitOptions = getAllKnownUnits(incidents);
  const staffOptions = getUnitStaff(unit);
  const suggestedUnit = UNITS[category];
  const hasExternalUpdate = version !== incident.updatedAt;
  const fieldTaskLink = `/field/tasks?id=${encodeURIComponent(incident.id)}`;

  const handleUnitChange = (nextUnit: string, manual: boolean) => {
    setUnit(nextUnit);
    if (manual) setUnitManuallyChosen(true);
    setUnitChangeNotice("");
    if (assignee && !isStaffInUnit(nextUnit, assignee)) {
      setAssignee("");
      setUnitChangeNotice(
        `Đã bỏ chọn “${assignee}” vì không thuộc ${nextUnit}. Hãy chọn cán bộ mới hoặc để đơn vị tự phân công.`,
      );
    }
  };

  if (incident.status !== "pending" && !editingAssignment) {
    return (
      <div className="dispatch-status-box">
        {receipt && incident.assignedTo ? (
          <div className="dispatch-receipt work-success" role="status">
            <div className="dispatch-receipt-head">
              <CheckCircle2 size={18} aria-hidden="true" />
              <strong>
                {receipt.isReassignment
                  ? "Đã lưu điều chỉnh phân công"
                  : "Đã lưu phân công xử lý"}
              </strong>
            </div>
            <p>
              Đơn vị nhận nhiệm vụ: <strong>{receipt.unitName}</strong>
            </p>
            <p>
              Người phụ trách: <strong>{receipt.assigneeName}</strong>
            </p>
            <p>
              Người phân công: <strong>{receipt.officerName}</strong>
            </p>
            <p>
              Hạn hoàn thành: <strong>{formatDate(receipt.deadline)}</strong>
            </p>
            {receipt.notes && <p>Ghi chú đã lưu: {receipt.notes}</p>}
            <Link
              className="work-secondary dispatch-field-link"
              to={fieldTaskLink}
            >
              Mở nhiệm vụ hiện trường{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : hasExternalUpdate ? (
          <div className="work-warning dispatch-conflict" role="alert">
            <div className="dispatch-receipt-head">
              <AlertTriangle size={18} aria-hidden="true" />
              <strong>
                Hồ sơ vừa chuyển sang “{STATUS_LABELS[incident.status]}” ở tab
                khác
              </strong>
            </div>
            <p>
              Vui lòng xem lại thông tin mới phía trên. Thao tác phân công đã
              được tắt để tránh ghi đè.
            </p>
            {notes.trim() && (
              <p className="work-help">Ghi chú bạn đã soạn: {notes.trim()}</p>
            )}
            <Link
              className="work-secondary dispatch-field-link"
              to={fieldTaskLink}
            >
              Mở nhiệm vụ hiện trường{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="dispatch-status-actions">
            <p className="work-help">
              Hồ sơ đang ở trạng thái{" "}
              <strong>{STATUS_LABELS[incident.status]}</strong>.
            </p>
            <div className="dispatch-action-row">
              <Link
                className="work-secondary dispatch-field-link"
                to={fieldTaskLink}
              >
                Mở nhiệm vụ hiện trường{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              {isReassignable && (
                <button
                  type="button"
                  className="work-secondary"
                  onClick={() => {
                    setCategory(incident.category);
                    setPriority(incident.priority);
                    setUnit(
                      incident.assignedTo?.unitName || UNITS[incident.category],
                    );
                    setUnitManuallyChosen(true);
                    setAssignee(incident.assignedTo?.assigneeName || "");
                    setNotes(incident.assignedTo?.notes || "");
                    setDeadline(
                      localDateTime(
                        incident.assignedTo
                          ? new Date(
                              Math.max(
                                Date.parse(incident.assignedTo.deadline),
                                Date.now() + 3600000,
                              ),
                            )
                          : new Date(Date.now() + 3 * 86400000),
                      ),
                    );
                    setReason("");
                    setError("");
                    setUnitChangeNotice("");
                    setVersion(incident.updatedAt);
                    setEditingAssignment(true);
                  }}
                >
                  <Pencil size={15} aria-hidden="true" />
                  Điều chỉnh phân công
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isReassignMode = editingAssignment && isReassignable;

  return (
    <form
      className="dispatch-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (submittingRef.current || hasExternalUpdate) return;
        setError("");
        const check = validateDispatchInput({
          unitName: unit,
          assigneeName: assignee,
          deadline,
          notes,
          reason,
          requireReason: isReassignMode,
        });
        if (!check.ok) {
          setError(check.error);
          return;
        }
        submittingRef.current = true;
        setSaving(true);
        try {
          if (isReassignMode) {
            reassignIncident(incident.id, {
              unitName: check.trimmedUnit,
              assigneeName: check.trimmedAssignee || undefined,
              category,
              priority,
              deadline: check.deadlineIso,
              notes: check.trimmedNotes,
              reason: check.trimmedReason,
              changedBy: currentUser.name,
              expectedUpdatedAt: version,
            });
          } else {
            assignIncident(
              incident.id,
              check.trimmedUnit,
              3,
              currentUser.name,
              {
                category,
                priority,
                assigneeName: check.trimmedAssignee || undefined,
                deadline: check.deadlineIso,
                notes: check.trimmedNotes,
                expectedUpdatedAt: version,
              },
            );
          }
          const savedReceipt: DispatchReceipt = {
            id: incident.id,
            code: incident.code,
            unitName: check.trimmedUnit,
            assigneeName: check.trimmedAssignee || UNASSIGNED_STAFF_LABEL,
            officerName: currentUser.name,
            deadline: check.deadlineIso,
            notes: check.trimmedNotes,
            isReassignment: isReassignMode,
          };
          setReceipt(savedReceipt);
          setEditingAssignment(false);
          onDone?.(savedReceipt);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Chưa lưu được phân công.",
          );
        } finally {
          submittingRef.current = false;
          setSaving(false);
        }
      }}
    >
      <div className="dispatch-form-header">
        <h3>{isReassignMode ? "Điều chỉnh phân công" : "Giao xử lý"}</h3>
        {isReassignMode && (
          <button
            type="button"
            className="work-text-link"
            onClick={() => {
              setEditingAssignment(false);
              setError("");
            }}
          >
            Hủy điều chỉnh
          </button>
        )}
      </div>
      <div className="work-form-grid">
        <label>
          Loại sự cố
          <select
            value={category}
            onChange={(event) => {
              const value = event.target.value as IncidentCategory;
              setCategory(value);
              if (!unitManuallyChosen) handleUnitChange(UNITS[value], false);
            }}
          >
            {Object.entries(CATEGORIES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mức độ
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IncidentPriority)
            }
          >
            <option value="normal">Bình thường</option>
            <option value="high">Ưu tiên cao</option>
            <option value="urgent">Khẩn cấp</option>
          </select>
        </label>
        <label>
          Đơn vị phụ trách
          <select
            aria-label="Đơn vị phụ trách"
            value={unit}
            onChange={(event) => handleUnitChange(event.target.value, true)}
          >
            {unitOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cán bộ phụ trách trong đơn vị
          <select
            aria-label="Cán bộ phụ trách trong đơn vị"
            value={assignee}
            onChange={(event) => {
              setAssignee(event.target.value);
              setUnitChangeNotice("");
            }}
          >
            <option value="">
              {UNASSIGNED_STAFF_LABEL} (giao cho đơn vị trước)
            </option>
            {staffOptions.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} — {member.role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hạn hoàn thành
          <input
            aria-label="Hạn hoàn thành"
            type="datetime-local"
            required
            min={minimumDeadline}
            value={deadline}
            onChange={(event) => {
              setDeadline(event.target.value);
              if (error) setError("");
            }}
          />
        </label>
      </div>
      <div className="unit-suggestion-row">
        <p className="work-help">
          Gợi ý theo loại sự cố: <strong>{suggestedUnit}</strong>. Có thể giao
          cho đơn vị trước khi chưa chỉ định cá nhân.
        </p>
        {unit !== suggestedUnit && (
          <button
            type="button"
            className="work-text-link"
            onClick={() => {
              handleUnitChange(suggestedUnit, false);
              setUnitManuallyChosen(false);
            }}
          >
            Dùng đơn vị gợi ý
          </button>
        )}
      </div>
      {unitChangeNotice && (
        <p className="work-warning" role="status">
          {unitChangeNotice}
        </p>
      )}
      {isReassignMode && (
        <label>
          Lý do điều chỉnh phân công (bắt buộc)
          <input
            aria-label="Lý do điều chỉnh phân công"
            type="text"
            required
            maxLength={500}
            placeholder="Ví dụ: Đổi tổ chuyên trách, gia hạn do mưa lớn…"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
          />
        </label>
      )}
      <label>
        Ghi chú giao việc
        <textarea
          rows={3}
          maxLength={1500}
          placeholder="Nêu công việc cần thực hiện, lưu ý an toàn tại hiện trường…"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      {hasExternalUpdate && (
        <div className="work-warning dispatch-conflict" role="alert">
          <p>
            Hồ sơ vừa thay đổi ở tab khác. Vui lòng xem lại thông tin mới phía
            trên trước khi lưu.
          </p>
          <button
            type="button"
            className="work-secondary"
            onClick={() => {
              setVersion(incident.updatedAt);
              setError("");
            }}
          >
            Đã xem thông tin mới
          </button>
        </div>
      )}
      {error && (
        <p className="work-error" role="alert">
          {error}
        </p>
      )}
      <div className="dispatch-submit-row">
        <button
          className="work-primary"
          type="submit"
          disabled={saving || hasExternalUpdate}
        >
          <Send size={16} aria-hidden="true" />
          {saving
            ? "Đang lưu…"
            : isReassignMode
              ? "Lưu điều chỉnh phân công"
              : "Xác nhận giao xử lý"}
        </button>
      </div>
    </form>
  );
}

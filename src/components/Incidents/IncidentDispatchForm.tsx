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
  deadlineLabel,
  formatDate,
  getIncidentMapVisual,
  isOverdue,
  validateDispatchInput,
} from "../../lib/incidents";
import { useIncidentStore } from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  Send,
  AlertTriangle,
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

      {incident.verificationNotes && (
        <p className="work-help">Ghi chú xác minh: {incident.verificationNotes}</p>
      )}
      {incident.assignedTo && (
        <div className="work-assignment">
          <span className="assignment-eyebrow">Đơn vị được giao</span>
          <strong>{incident.assignedTo.unitName}</strong>
          <span className={overdue ? "overdue-text" : ""}>
            Hạn hoàn thành: {formatDate(incident.assignedTo.deadline)} ·{" "}
            {deadlineLabel(incident, referenceNow)}
          </span>
          {incident.assignedTo.notes && <p>Ghi chú: {incident.assignedTo.notes}</p>}
        </div>
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

export function IncidentDispatchForm({
  incident,
  onDone,
}: {
  incident: Incident;
  onDone?: (assigned: {
    id: string;
    code: string;
    unitName: string;
    deadline: string;
    notes: string;
  }) => void;
}) {
  const assignIncident = useIncidentStore((s) => s.assignIncident);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [category, setCategory] = useState(incident.category);
  const [unit, setUnit] = useState(UNITS[incident.category]);
  const [unitManuallyChosen, setUnitManuallyChosen] = useState(false);
  const [priority, setPriority] = useState(incident.priority);
  const [deadline, setDeadline] = useState(() =>
    localDateTime(new Date(Date.now() + 3 * 86400000)),
  );
  const [minimumDeadline] = useState(() => localDateTime(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(incident.updatedAt);
  const [dispatchedHere, setDispatchedHere] = useState(false);
  const submittingRef = useRef(false);

  const suggestedUnit = UNITS[category];
  const hasExternalUpdate = version !== incident.updatedAt;

  if (incident.status !== "pending") {
    if (dispatchedHere && incident.assignedTo) {
      return (
        <div className="dispatch-receipt work-success" role="status">
          <div className="dispatch-receipt-head">
            <CheckCircle2 size={18} aria-hidden="true" />
            <strong>Đã lưu phân công xử lý</strong>
          </div>
          <p>
            Đơn vị: <strong>{incident.assignedTo.unitName}</strong>
          </p>
          <p>
            Hạn hoàn thành: <strong>{formatDate(incident.assignedTo.deadline)}</strong>
          </p>
          {incident.assignedTo.notes && (
            <p>Ghi chú đã lưu: {incident.assignedTo.notes}</p>
          )}
          <Link className="work-secondary dispatch-field-link" to="/field/tasks">
            Mở nhiệm vụ hiện trường <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      );
    }

    if (hasExternalUpdate) {
      return (
        <div className="work-warning dispatch-conflict" role="alert">
          <div className="dispatch-receipt-head">
            <AlertTriangle size={18} aria-hidden="true" />
            <strong>
              Hồ sơ vừa chuyển sang “{STATUS_LABELS[incident.status]}” ở tab khác
            </strong>
          </div>
          <p>
            Vui lòng xem lại thông tin mới phía trên. Thao tác phân công đã được
            tắt để tránh ghi đè.
          </p>
          {notes.trim() && (
            <p className="work-help">Ghi chú bạn đã soạn: {notes.trim()}</p>
          )}
          <Link className="work-secondary dispatch-field-link" to="/field/tasks">
            Mở nhiệm vụ hiện trường <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      );
    }

    return (
      <div className="dispatch-status-box">
        <p className="work-help">
          Hồ sơ đang ở trạng thái <strong>{STATUS_LABELS[incident.status]}</strong>.
        </p>
        <Link className="work-secondary dispatch-field-link" to="/field/tasks">
          Mở nhiệm vụ hiện trường <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

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
          deadline,
          notes,
        });
        if (!check.ok) {
          setError(check.error);
          return;
        }
        submittingRef.current = true;
        setSaving(true);
        try {
          assignIncident(incident.id, check.trimmedUnit, 3, currentUser.name, {
            category,
            priority,
            deadline: check.deadlineIso,
            notes: check.trimmedNotes,
            expectedUpdatedAt: version,
          });
          setDispatchedHere(true);
          onDone?.({
            id: incident.id,
            code: incident.code,
            unitName: check.trimmedUnit,
            deadline: check.deadlineIso,
            notes: check.trimmedNotes,
          });
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
      <h3>Giao xử lý</h3>
      <div className="work-form-grid">
        <label>
          Loại sự cố
          <select
            value={category}
            onChange={(event) => {
              const value = event.target.value as IncidentCategory;
              setCategory(value);
              if (!unitManuallyChosen) setUnit(UNITS[value]);
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
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value);
              setUnitManuallyChosen(true);
            }}
          >
            {Object.values(UNITS).map((name) => (
              <option key={name} value={name}>
                {name}
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
          Gợi ý theo loại sự cố: <strong>{suggestedUnit}</strong> (cán bộ có thể
          đổi đơn vị và thời hạn).
        </p>
        {unit !== suggestedUnit && (
          <button
            type="button"
            className="work-text-link"
            onClick={() => {
              setUnit(suggestedUnit);
              setUnitManuallyChosen(false);
            }}
          >
            Dùng đơn vị gợi ý
          </button>
        )}
      </div>
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
            trên trước khi giao.
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
          {saving ? "Đang lưu…" : "Xác nhận giao xử lý"}
        </button>
      </div>
    </form>
  );
}

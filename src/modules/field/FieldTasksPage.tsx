import { useState } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  ClipboardCheck,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useIncidentStore } from "../../store/useIncidentStore";
import { IncidentResolutionModal } from "./IncidentResolutionModal";
import {
  CATEGORIES,
  STATUS_LABELS,
  deadlineLabel,
  formatDate,
  isComplete,
  isOverdue,
} from "../../lib/incidents";
export function FieldTasksPage() {
  const { incidents, verifyIncident, startIncident } = useIncidentStore();
  const [tab, setTab] = useState<"assigned" | "verify" | "completed">(
    "assigned",
  );
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const groups = {
    assigned: incidents.filter(
      (i) => i.status === "assigned" || i.status === "in_progress",
    ),
    verify: incidents.filter((i) => !isComplete(i) && !i.verifiedByVolunteer),
    completed: incidents.filter(isComplete),
  };
  const target = incidents.find((i) => i.id === resolveId);
  const act = (action: () => void, text: string) => {
    setError("");
    try {
      action();
      setMessage(text);
    } catch (error) {
      setError((error as Error).message);
    }
  };
  return (
    <div className="officer-workbench">
      <div className="work-heading">
        <div>
          <h2>Nhiệm vụ hiện trường</h2>
          <p>Xác minh tại chỗ, nhận việc và cập nhật ảnh sau xử lý</p>
        </div>
        <Link className="work-text-link" to="/dashboard">
          Bàn làm việc →
        </Link>
      </div>
      <div className="work-tabs">
        <button
          aria-pressed={tab === "assigned"}
          onClick={() => setTab("assigned")}
        >
          Cần xử lý ({groups.assigned.length})
        </button>
        <button
          aria-pressed={tab === "verify"}
          onClick={() => setTab("verify")}
        >
          Cần xác minh ({groups.verify.length})
        </button>
        <button
          aria-pressed={tab === "completed"}
          onClick={() => setTab("completed")}
        >
          Đã xử lý ({groups.completed.length})
        </button>
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
        Bản demo hiển thị nhiệm vụ của các tổ minh họa trên địa bàn. Xác minh
        không thay thế việc phân công.
      </p>
      <div className="field-grid">
        {groups[tab]
          .sort(
            (a, b) =>
              Number(isOverdue(b)) - Number(isOverdue(a)) ||
              Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
          )
          .map((item) => (
            <article className="work-surface field-task" key={item.id}>
              <div className="work-incident-top">
                <span className="work-code">{item.code}</span>
                <span
                  className={`work-badge ${isComplete(item) ? "green" : "blue"}`}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              <h3>{item.title}</h3>
              <p className="work-address">
                <MapPin size={14} />
                {item.location.address}
              </p>
              <p className="work-help">
                {CATEGORIES[item.category]} ·{" "}
                {item.verifiedByVolunteer ? "Đã xác minh" : "Chưa xác minh"}
              </p>
              {item.assignedTo && (
                <div className="work-assignment">
                  <strong>{item.assignedTo.unitName}</strong>
                  <span className={isOverdue(item) ? "overdue-text" : ""}>
                    {deadlineLabel(item)} ·{" "}
                    {formatDate(item.assignedTo.deadline)}
                  </span>
                  {item.assignedTo.notes && <p>{item.assignedTo.notes}</p>}
                </div>
              )}
              {item.verificationNotes && (
                <p className="work-help">Xác minh: {item.verificationNotes}</p>
              )}
              {item.resolution && (
                <p className="work-help">Kết quả: {item.resolution.notes}</p>
              )}
              <div className="field-actions">
                {!isComplete(item) && !item.verifiedByVolunteer && (
                  <button
                    className="work-secondary"
                    onClick={() => {
                      setVerifyId(verifyId === item.id ? null : item.id);
                      setNotes("");
                    }}
                  >
                    <ClipboardCheck size={16} />
                    Xác minh
                  </button>
                )}
                {item.status === "assigned" && (
                  <button
                    className="work-primary"
                    onClick={() =>
                      act(
                        () => startIncident(item.id),
                        "Đã nhận việc. Trạng thái mới đã đồng bộ đến tab cán bộ.",
                      )
                    }
                  >
                    <Play size={15} />
                    Nhận và bắt đầu
                  </button>
                )}
                {item.status === "in_progress" && (
                  <button
                    className="work-primary"
                    onClick={() => setResolveId(item.id)}
                  >
                    <Camera size={16} />
                    Cập nhật kết quả
                  </button>
                )}
                {isComplete(item) && (
                  <span className="work-text-link">
                    <CheckCircle2 size={16} />
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
          ))}
      </div>
      {!groups[tab].length && (
        <div className="work-empty">
          <CheckCircle2 size={32} />
          <h3>Không có nhiệm vụ trong nhóm này</h3>
          <p>Nhiệm vụ mới được giao sẽ xuất hiện tại đây.</p>
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

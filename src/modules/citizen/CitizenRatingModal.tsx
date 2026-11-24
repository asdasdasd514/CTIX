import { useEffect, useRef, useState } from "react";
import { X, Star } from "lucide-react";
import type { Incident } from "../../types/incident";
import { useIncidentStore } from "../../store/useIncidentStore";
export function CitizenRatingModal({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const rateIncident = useIncidentStore((s) => s.rateIncident);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const labels = [
    "Rất không hài lòng",
    "Không hài lòng",
    "Bình thường",
    "Hài lòng",
    "Rất hài lòng",
  ];
  return (
    <dialog
      ref={dialog}
      className="work-dialog"
      aria-labelledby="rating-heading"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="work-dialog-header">
        <div>
          <h2 id="rating-heading">Đánh giá kết quả xử lý</h2>
          <p>
            {incident.code} · {incident.title}
          </p>
        </div>
        <button
          className="work-icon-button"
          aria-label="Đóng đánh giá"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <form
        className="work-detail"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            rateIncident(incident.id, stars, [], comment.trim());
            onClose();
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <p>Bạn hài lòng với kết quả xử lý ở mức nào?</p>
        <div
          className="rating-options"
          role="group"
          aria-label="Chọn mức độ hài lòng"
        >
          {labels.map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={`${index + 1} sao — ${label}`}
              aria-pressed={stars === index + 1}
              onClick={() => setStars(index + 1)}
            >
              <Star size={28} fill={stars >= index + 1 ? "#eab308" : "none"} />
              <span>{index + 1}</span>
            </button>
          ))}
        </div>
        <p className="work-help" aria-live="polite">
          {stars ? labels[stars - 1] : "Chọn từ 1 đến 5 sao để đánh giá."}
        </p>
        <label className="work-form-label">
          Góp ý thêm (không bắt buộc)
          <textarea
            rows={3}
            maxLength={1500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Điều gì đã tốt hoặc cần cải thiện?"
          />
        </label>
        {error && (
          <p className="work-error" role="alert">
            {error}
          </p>
        )}
        <div className="field-actions">
          <button type="button" className="work-secondary" onClick={onClose}>
            Để sau
          </button>
          <button type="submit" disabled={!stars} className="work-primary">
            Gửi đánh giá
          </button>
        </div>
      </form>
    </dialog>
  );
}

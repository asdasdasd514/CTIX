import { useEffect, useRef, useState } from "react";
import { X, Camera, CheckCircle2 } from "lucide-react";
import type { Incident } from "../../types/incident";
import { useIncidentStore } from "../../store/useIncidentStore";
import { useAuthStore } from "../../store/useAuthStore";
import { readPhoto } from "../../lib/photos";
import { mediaApi } from "../../services/api";
export function IncidentResolutionModal({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolveIncident = useIncidentStore((s) => s.resolveIncident);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [photo, setPhoto] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="work-dialog"
      aria-labelledby="resolution-heading"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="work-dialog-header">
        <div>
          <h2 id="resolution-heading">Cập nhật kết quả xử lý</h2>
          <p>
            {incident.code} · {incident.title}
          </p>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          className="work-icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <form
        className="work-detail"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            resolveIncident(
              incident.id,
              notes,
              photo ? [photo] : [],
              currentUser.name,
            );
            onClose();
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <div className="resolution-photos">
          <figure>
            <img src={incident.photosBefore[0]} alt="Trước xử lý" />
            <figcaption>Ảnh trước xử lý</figcaption>
          </figure>
          <figure>
            {photo ? (
              <img src={photo} alt="Sau xử lý" />
            ) : (
              <div className="photo-placeholder">
                <Camera size={28} />
                <span>Chưa có ảnh sau xử lý</span>
              </div>
            )}
            <figcaption>Ảnh sau xử lý · bắt buộc</figcaption>
          </figure>
        </div>
        <label className="work-form-label">
          Tải ảnh sau xử lý
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLoading(true);
              setError("");
              try {
                try {
                  const urls = await mediaApi.uploadFiles([file], "after");
                  if (urls[0]) {
                    setPhoto(urls[0]);
                  } else {
                    setPhoto(await readPhoto(file));
                  }
                } catch {
                  setPhoto(await readPhoto(file));
                }
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          />
        </label>
        <button
          type="button"
          className="work-text-link"
          onClick={() =>
            setPhoto(
              "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=600&auto=format&fit=crop&q=70",
            )
          }
        >
          Dùng ảnh minh họa để thử demo
        </button>
        <label className="work-form-label">
          Nội dung khắc phục
          <textarea
            required
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Đã xử lý những gì, tình trạng hiện tại…"
          />
        </label>
        <p className="work-help">
          Ảnh và nội dung sẽ hiển thị cho người dân sau khi xác nhận.
        </p>
        {error && (
          <p className="work-error" role="alert">
            {error}
          </p>
        )}
        <div className="field-actions">
          <button className="work-secondary" type="button" onClick={onClose}>
            Quay lại
          </button>
          <button
            className="work-primary"
            type="submit"
            disabled={
              !photo ||
              !notes.trim() ||
              loading ||
              incident.status !== "in_progress"
            }
          >
            <CheckCircle2 size={16} />
            {loading ? "Đang đọc ảnh…" : "Hoàn tất và công khai"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

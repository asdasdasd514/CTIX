import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import { useIncidentStore } from "../../store/useIncidentStore";
import { PRESET_ACCOUNTS } from "../../store/useAuthStore";
import type { IncidentCategory, IncidentLocation } from "../../types/incident";
import { CATEGORIES, distanceMeters, isComplete } from "../../lib/incidents";
import { readPhoto } from "../../lib/photos";
export function SubmitIncidentWizard() {
  const { incidents, addIncident } = useIncidentStore();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<IncidentLocation>({
    lat: 10.9572,
    lng: 106.8184,
    address: "",
  });
  const [positionChosen, setPositionChosen] = useState(false);
  const [category, setCategory] = useState<IncidentCategory>("street_light");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(
    PRESET_ACCOUNTS.citizen.phone.replace(/[\s.]/g, ""),
  );
  const [error, setError] = useState("");
  const [group, setGroup] = useState(false);
  const [result, setResult] = useState<{
    code: string;
    id: string;
    grouped: boolean;
  } | null>(null);
  const duplicate = incidents.find(
    (i) =>
      i.category === category &&
      !isComplete(i) &&
      distanceMeters(i.location, location) <= 50,
  );
  const next = () => {
    setError("");
    if (step === 1 && !photo) {
      setError("Chụp hoặc chọn một ảnh hiện trường.");
      return;
    }
    if (step === 2 && (!positionChosen || !location.address.trim())) {
      setError("Chọn điểm trên bản đồ và nhập địa chỉ dễ tìm.");
      return;
    }
    setStep(step + 1);
  };
  if (result)
    return (
      <section className="citizen-submit work-surface work-empty">
        <CheckCircle2 size={48} color="#15803d" />
        <h2>
          {result.grouped
            ? "Đã thêm vào phản ánh cùng sự cố"
            : "Đã gửi phản ánh"}
        </h2>
        <p>
          Mã hồ sơ: <strong>{result.code}</strong>
        </p>
        <p>
          Ảnh và thông tin đã được lưu. Cán bộ tiếp nhận có thể xem ở tab bàn
          làm việc.
        </p>
        <Link
          className="work-primary"
          to={`/citizen/reports?id=${encodeURIComponent(result.id)}`}
        >
          Theo dõi phản ánh
        </Link>
        <button
          className="work-secondary"
          onClick={() => {
            setResult(null);
            setStep(1);
            setPhoto("");
            setDescription("");
            setPositionChosen(false);
            setGroup(false);
          }}
        >
          Gửi phản ánh khác
        </button>
      </section>
    );
  return (
    <div className="citizen-submit officer-workbench">
      <div className="work-heading">
        <div>
          <h1>Gửi phản ánh hiện trường</h1>
          <p>Chụp ảnh, chọn vị trí và mô tả sự cố để phường tiếp nhận.</p>
        </div>
      </div>
      <ol className="submit-steps">
        {[
          { label: "Ảnh hiện trường", icon: Camera },
          { label: "Vị trí", icon: MapPin },
          { label: "Loại sự cố", icon: CheckCircle2 },
        ].map(({ label, icon: Icon }, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? "step" : undefined}
            className={step >= index + 1 ? "current" : ""}
          >
            <Icon size={18} />
            <span>
              {index + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
      <form
        className="work-surface work-detail"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            const response = addIncident({
              category,
              description,
              location,
              photosBefore: [photo],
              senderName: PRESET_ACCOUNTS.citizen.name,
              senderPhone: phone,
              duplicateOf: group ? duplicate?.id : undefined,
            });
            setResult({
              code: response.incident.code,
              id: response.incident.id,
              grouped: response.isDuplicateGrouped,
            });
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        {step === 1 && (
          <>
            <h2>Chụp hoặc chọn ảnh hiện trường</h2>
            <p>
              Chọn ảnh rõ sự cố. Tránh chụp thông tin riêng tư của người khác.
            </p>
            {photo && (
              <img
                className="submit-photo"
                src={photo}
                alt="Ảnh hiện trường đã chọn"
              />
            )}
            <label className="work-form-label">
              Chọn ảnh JPG, PNG hoặc WebP (tối đa 10 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={loading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError("");
                  setLoading(true);
                  try {
                    setPhoto(await readPhoto(file));
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
                  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=70",
                )
              }
            >
              Dùng ảnh minh họa để thử demo
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2>Sự cố ở đâu?</h2>
            <p>
              Chạm lên bản đồ để ghim đúng điểm. Có thể dùng GPS nếu bạn đang ở
              hiện trường.
            </p>
            <OpenStreetMap
              height="340px"
              singlePin={
                positionChosen
                  ? { ...location, label: location.address || "Vị trí đã chọn" }
                  : undefined
              }
              onMapClick={(lat, lng) => {
                setLocation({ ...location, lat, lng });
                setPositionChosen(true);
                setGroup(false);
              }}
            />
            <p className="work-help">
              {positionChosen
                ? `Đã ghim: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                : "Chưa chọn vị trí sự cố."}
            </p>
            <label className="work-form-label">
              Địa chỉ hoặc mốc dễ tìm
              <input
                aria-label="Địa chỉ sự cố"
                value={location.address}
                onChange={(e) =>
                  setLocation({ ...location, address: e.target.value })
                }
                placeholder="Ví dụ: trước số nhà 20, đường Nguyễn Ái Quốc…"
                maxLength={300}
              />
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <h2>Chọn loại và mô tả sự cố</h2>
            <div className="submit-categories">
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={category === value}
                    onChange={() => {
                      setCategory(value as IncidentCategory);
                      setGroup(false);
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <label className="work-form-label">
              Mô tả ngắn
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                placeholder="Sự cố xảy ra như thế nào, có nguy hiểm không?"
              />
            </label>
            <label className="work-form-label">
              Số điện thoại theo dõi hồ sơ
              <input
                type="tel"
                inputMode="numeric"
                required
                pattern="0[0-9]{9}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <p className="work-help">
              Địa chỉ: {location.address} · {location.lat.toFixed(5)},{" "}
              {location.lng.toFixed(5)}
            </p>
            {duplicate && (
              <div className="work-warning">
                <strong>
                  Có phản ánh tương tự trong 50 m: {duplicate.code}
                </strong>
                <p>{duplicate.title}</p>
                <label className="urgent-filter">
                  <input
                    type="checkbox"
                    checked={group}
                    onChange={(e) => setGroup(e.target.checked)}
                  />
                  Tôi xác nhận đây là cùng sự cố, thêm ảnh của tôi vào hồ sơ này
                </label>
                <p className="work-help">
                  Nếu là sự cố khác, để trống để tạo hồ sơ riêng.
                </p>
              </div>
            )}
          </>
        )}
        {error && (
          <p className="work-error" role="alert">
            {error}
          </p>
        )}
        <div className="submit-actions">
          {step > 1 && (
            <button
              type="button"
              className="work-secondary"
              onClick={() => {
                setStep(step - 1);
                setError("");
              }}
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className="work-primary"
              disabled={loading}
              onClick={next}
            >
              {loading ? "Đang đọc ảnh…" : "Tiếp tục"}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" className="work-primary">
              Gửi phản ánh
            </button>
          )}
        </div>
      </form>
      <p className="work-footer-note">
        Bản demo dùng dữ liệu giả lập; đồng bộ các tab cùng trình duyệt trên máy
        này.
      </p>
    </div>
  );
}

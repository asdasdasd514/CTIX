import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Map } from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  IncidentDispatchForm,
  IncidentOverview,
} from "../../components/Incidents/IncidentDispatchForm";

export function DispatchDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const backPath =
    from === "map"
      ? "/map"
      : from === "statistics"
        ? "/statistics"
        : "/dashboard";
  const backLabel =
    from === "map"
      ? "Quay lại Bản đồ phản ánh"
      : from === "statistics"
        ? "Quay lại Thống kê"
        : "Quay lại Tiếp nhận & phân công";

  const incident = useIncidentStore((s) =>
    s.incidents.find((i) => i.id === id),
  );
  if (!incident)
    return (
      <section className="work-surface work-empty" role="alert">
        <AlertTriangle size={32} aria-hidden="true" />
        <h2>Không tìm thấy hồ sơ</h2>
        <p>
          Mã đường dẫn không khớp với hồ sơ nào trong dữ liệu hiện tại. Hệ thống
          không tự mở hồ sơ khác.
        </p>
        <Link className="work-primary" to={backPath}>
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      </section>
    );
  return (
    <div className="officer-workbench">
      <nav className="dispatch-breadcrumb" aria-label="Đường dẫn điều hướng">
        <Link className="work-text-link" to={backPath}>
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
        {from !== "map" && (
          <Link className="work-text-link" to="/map">
            <Map size={16} aria-hidden="true" />
            Mở Bản đồ phản ánh
          </Link>
        )}
      </nav>
      <section className="work-surface work-detail">
        <div className="work-detail-heading">
          <div>
            <span className="work-code">{incident.code}</span>
            <h2>{incident.title}</h2>
          </div>
        </div>
        <IncidentOverview incident={incident} />
        <OpenStreetMap
          title="Vị trí hiện trường"
          center={[incident.location.lat, incident.location.lng]}
          zoom={16}
          singlePin={{ ...incident.location, label: incident.location.address }}
          height="260px"
          expandable
        />
        <IncidentDispatchForm key={incident.id} incident={incident} />
      </section>
    </div>
  );
}

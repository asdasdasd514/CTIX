import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useIncidentStore } from "../../store/useIncidentStore";
import { OpenStreetMap } from "../../components/Map/OpenStreetMap";
import {
  IncidentDispatchForm,
  IncidentOverview,
} from "../../components/Incidents/IncidentDispatchForm";

export function DispatchDetailPage() {
  const { id } = useParams();
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
        <Link className="work-primary" to="/dashboard">
          <ArrowLeft size={16} aria-hidden="true" />
          Quay lại bàn làm việc
        </Link>
      </section>
    );
  return (
    <div className="officer-workbench">
      <div>
        <Link className="work-text-link" to="/dashboard">
          <ArrowLeft size={16} aria-hidden="true" />
          Quay lại bàn làm việc
        </Link>
      </div>
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
          height="280px"
          expandable
        />
        <IncidentDispatchForm key={incident.id} incident={incident} />
      </section>
    </div>
  );
}

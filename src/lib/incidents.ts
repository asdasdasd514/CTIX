import type {
  Incident,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
} from "../types/incident.ts";

export const CATEGORIES: Record<IncidentCategory, string> = {
  street_light: "Đèn đường",
  flooding: "Ngập nước",
  waste: "Rác thải",
  road_damage: "Mặt đường",
};
export const CATEGORY_CODES: Record<IncidentCategory, string> = {
  street_light: "Đ",
  flooding: "N",
  waste: "R",
  road_damage: "M",
};
export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  normal: "Bình thường",
  high: "Ưu tiên cao",
  urgent: "Khẩn cấp",
};
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  pending: "Chờ phân công",
  assigned: "Đã giao xử lý",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đã đánh giá",
};
export const UNITS: Record<IncidentCategory, string> = {
  street_light: "Tổ bảo trì chiếu sáng",
  flooding: "Tổ thoát nước",
  waste: "Tổ vệ sinh môi trường",
  road_damage: "Tổ bảo trì đường bộ",
};

export type MapStatusKey = "pending" | "active" | "urgent_overdue" | "completed";
export interface MapStatusVisual {
  key: MapStatusKey;
  label: string;
  color: string;
  symbol: string;
  shape: "square" | "circle" | "alert";
}
export const MAP_STATUS_VISUALS: Record<MapStatusKey, MapStatusVisual> = {
  pending: {
    key: "pending",
    label: "Chờ phân công",
    color: "#b45309",
    symbol: "…",
    shape: "square",
  },
  active: {
    key: "active",
    label: "Đang xử lý",
    color: "#1d4ed8",
    symbol: "▸",
    shape: "circle",
  },
  urgent_overdue: {
    key: "urgent_overdue",
    label: "Khẩn / quá hạn",
    color: "#be123c",
    symbol: "!",
    shape: "alert",
  },
  completed: {
    key: "completed",
    label: "Đã xử lý",
    color: "#15803d",
    symbol: "✓",
    shape: "circle",
  },
};
export const MAP_STATUS_ORDER: MapStatusKey[] = [
  "pending",
  "active",
  "urgent_overdue",
  "completed",
];
export function getIncidentMapVisual(
  item: Incident,
  now = Date.now(),
): MapStatusVisual {
  if (isComplete(item)) return MAP_STATUS_VISUALS.completed;
  if (isOverdue(item, now) || item.priority === "urgent")
    return MAP_STATUS_VISUALS.urgent_overdue;
  if (item.status === "pending") return MAP_STATUS_VISUALS.pending;
  return MAP_STATUS_VISUALS.active;
}

export function validateDispatchInput({
  unitName,
  deadline,
  notes = "",
  now = Date.now(),
}: {
  unitName: string;
  deadline: string;
  notes?: string;
  now?: number;
}): { ok: true; deadlineIso: string; trimmedUnit: string; trimmedNotes: string } | { ok: false; error: string } {
  const trimmedUnit = unitName.trim();
  if (!trimmedUnit)
    return { ok: false, error: "Vui lòng chọn đơn vị phụ trách." };
  if (!deadline.trim())
    return { ok: false, error: "Vui lòng nhập hạn hoàn thành cụ thể." };
  const parsed = Date.parse(deadline);
  if (!Number.isFinite(parsed))
    return { ok: false, error: "Hạn hoàn thành không đúng định dạng ngày giờ." };
  if (parsed <= now)
    return { ok: false, error: "Hạn hoàn thành phải sau thời điểm hiện tại." };
  const trimmedNotes = notes.trim();
  if (trimmedNotes.length > 1500)
    return { ok: false, error: "Ghi chú giao việc tối đa 1500 ký tự." };
  return {
    ok: true,
    deadlineIso: new Date(parsed).toISOString(),
    trimmedUnit,
    trimmedNotes,
  };
}
export const isComplete = (item: Incident) =>
  item.status === "resolved" || item.status === "closed";
export const isOverdue = (item: Incident, now = Date.now()) =>
  !isComplete(item) &&
  !!item.assignedTo &&
  Date.parse(item.assignedTo.deadline) < now;
export const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export function deadlineLabel(item: Incident, now = Date.now()) {
  if (isComplete(item)) return "Đã hoàn thành";
  if (!item.assignedTo) return "Chưa đặt hạn xử lý";
  const minutes = Math.max(
    1,
    Math.ceil(Math.abs(Date.parse(item.assignedTo.deadline) - now) / 60000),
  );
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const duration = days
    ? `${days} ngày${hours ? ` ${hours} giờ` : ""}`
    : hours
      ? `${hours} giờ`
      : `${minutes} phút`;
  return `${isOverdue(item, now) ? "Quá hạn" : "Còn"} ${duration}`;
}
export function incidentStats(items: Incident[], now = Date.now()) {
  const completed = items.filter(isComplete);
  const durations = completed.filter(
    (i) =>
      i.resolution &&
      Date.parse(i.resolution.resolvedAt) >= Date.parse(i.createdAt),
  );
  const rated = completed.filter((i) => i.rating);
  const withDeadline = completed.filter((i) => i.assignedTo && i.resolution);
  return {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    active: items.filter(
      (i) => i.status === "assigned" || i.status === "in_progress",
    ).length,
    completed: completed.length,
    overdue: items.filter((i) => isOverdue(i, now)).length,
    averageDays: durations.length
      ? durations.reduce(
          (sum, i) =>
            sum +
            (Date.parse(i.resolution!.resolvedAt) - Date.parse(i.createdAt)) /
              86400000,
          0,
        ) / durations.length
      : null,
    averageRating: rated.length
      ? rated.reduce((sum, i) => sum + i.rating!.stars, 0) / rated.length
      : null,
    rated: rated.length,
    onTime: withDeadline.length
      ? (withDeadline.filter(
          (i) =>
            Date.parse(i.resolution!.resolvedAt) <=
            Date.parse(i.assignedTo!.deadline),
        ).length /
          withDeadline.length) *
        100
      : null,
  };
}
export function validCoordinates(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}
export function safeImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export function distanceMeters(
  a: Incident["location"],
  b: Incident["location"],
) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

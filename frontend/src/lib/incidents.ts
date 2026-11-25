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
  other: "Sự cố khác",
};
export const CATEGORY_CODES: Record<IncidentCategory, string> = {
  street_light: "Đ",
  flooding: "N",
  waste: "R",
  road_damage: "M",
  other: "K",
};
export const PRIORITY_LABELS: Record<IncidentPriority, string> = {
  normal: "Bình thường",
  high: "Ưu tiên cao",
  urgent: "Khẩn cấp",
};
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  pending_review: "Chờ duyệt",
  pending: "Chờ phân công",
  assigned: "Đã giao xử lý",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đã đánh giá",
  rejected: "Từ chối tiếp nhận",
};

/**
 * Hồ sơ công khai hiển thị trên Cổng Công Dân (ẩn bài Chờ duyệt & Từ chối tiếp nhận).
 */
export function isPublicIncident(item: Pick<Incident, "status">): boolean {
  return item.status !== "pending_review" && item.status !== "rejected";
}
export const UNITS: Record<IncidentCategory, string> = {
  street_light: "Tổ bảo trì chiếu sáng",
  flooding: "Tổ thoát nước",
  waste: "Tổ vệ sinh môi trường",
  road_damage: "Tổ bảo trì đường bộ",
  other: "Tổ xử lý sự cố tổng hợp",
};

export const DEFAULT_WORKFLOW_TEMPLATES: Record<IncidentCategory, string[]> = {
  street_light: [
    "Kiểm tra nguồn điện và đảm bảo an toàn cột đèn",
    "Thay thế bóng đèn, chấn lưu hoặc đấu nối lại dây dẫn",
    "Bật kiểm tra chiếu sáng và chụp ảnh nghiệm thu",
  ],
  flooding: [
    "Đặt biển cảnh báo khu vực ngập nước cho người dân",
    "Khơi thông miệng cống và thu gom rác gây tắc nghẽn",
    "Kiểm tra dòng chảy thoát nước và vệ sinh mặt đường",
  ],
  waste: [
    "Thu gom và phân loại rác thải tồn lưu tại điểm tập kết",
    "Vệ sinh, xịt rửa khử mùi khu vực xung quanh",
    "Kiểm tra sạch sẽ và chụp ảnh nghiệm thu hiện trường",
  ],
  road_damage: [
    "Rào chắn và đặt biển cảnh báo an toàn giao thông",
    "Dọn sạch hố sụt, rải đá cấp phối hoặc nhựa nóng vá ổ gà",
    "Lu lèn bằng phẳng, thu dọn mặt bằng và nghiệm thu",
  ],
  other: [
    "Tiếp cận hiện trường và đánh giá mức độ an toàn",
    "Triển khai biện pháp khắc phục chuyên môn",
    "Kiểm tra hoàn thiện và chụp ảnh nghiệm thu",
  ],
};

export interface UnitStaffMember {
  id: string;
  name: string;
  role: string;
}
export interface DemoUnit {
  id: string;
  name: string;
  category: IncidentCategory;
  staff: UnitStaffMember[];
}
export const DEMO_UNITS: DemoUnit[] = [
  {
    id: "unit-light",
    name: UNITS.street_light,
    category: "street_light",
    staff: [
      { id: "staff-hung", name: "Nguyễn Văn Hùng", role: "Kỹ thuật chiếu sáng" },
      { id: "staff-bao", name: "Trần Quốc Bảo", role: "Tổ viên chiếu sáng" },
    ],
  },
  {
    id: "unit-flood",
    name: UNITS.flooding,
    category: "flooding",
    staff: [
      { id: "staff-tuan", name: "Phạm Minh Tuấn", role: "Tổ trưởng thoát nước" },
      { id: "staff-son", name: "Lê Văn Sơn", role: "Kỹ thuật thoát nước" },
    ],
  },
  {
    id: "unit-waste",
    name: UNITS.waste,
    category: "waste",
    staff: [
      { id: "staff-lan", name: "Đỗ Thị Lan", role: "Tổ trưởng vệ sinh" },
      { id: "staff-phuc", name: "Võ Hoàng Phúc", role: "Nhân viên môi trường" },
    ],
  },
  {
    id: "unit-road",
    name: UNITS.road_damage,
    category: "road_damage",
    staff: [
      { id: "staff-danh", name: "Huỳnh Công Danh", role: "Kỹ thuật đường bộ" },
      { id: "staff-thang", name: "Bùi Đức Thắng", role: "Tổ viên duy tu" },
    ],
  },
  {
    id: "unit-other",
    name: UNITS.other,
    category: "other",
    staff: [
      { id: "staff-nghia", name: "Nguyễn Hữu Nghĩa", role: "Cán bộ điều phối tổng hợp" },
      { id: "staff-hoa", name: "Lê Minh Hòa", role: "Tổ viên phản ứng nhanh" },
    ],
  },
];

export const UNASSIGNED_STAFF_LABEL = "Chưa chỉ định cán bộ";
export const UNASSIGNED_UNIT_FILTER = "__unassigned__";

export function getUnitStaff(unitName: string): UnitStaffMember[] {
  return DEMO_UNITS.find((u) => u.name === unitName)?.staff ?? [];
}
export function findUnitStaffMember(
  unitName: string,
  assigneeIdOrName?: string,
): UnitStaffMember | undefined {
  const key = assigneeIdOrName?.trim();
  if (!key) return undefined;
  return getUnitStaff(unitName).find((s) => s.id === key || s.name === key);
}
export function isStaffInUnit(unitName: string, assigneeName?: string): boolean {
  const key = assigneeName?.trim();
  if (!key) return true;
  return getUnitStaff(unitName).some((s) => s.name === key || s.id === key);
}
export function getAssigneeLabel(
  assignedTo?: Incident["assignedTo"],
): string {
  return assignedTo?.assigneeName?.trim() || UNASSIGNED_STAFF_LABEL;
}
export function getAllKnownUnits(items: Incident[]): string[] {
  const names = new Set<string>(DEMO_UNITS.map((u) => u.name));
  for (const item of items) {
    if (item.assignedTo?.unitName) names.add(item.assignedTo.unitName);
  }
  return Array.from(names);
}
export function getAllKnownAssignees(items: Incident[]): string[] {
  const names = new Set<string>();
  for (const item of items) {
    const name = item.assignedTo?.assigneeName?.trim();
    if (name) names.add(name);
  }
  return Array.from(names);
}
export function incidentMonthKey(createdAt: string): string {
  return new Date(createdAt)
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
    .slice(0, 7);
}
export function priorityRank(priority: IncidentPriority): number {
  return priority === "urgent" ? 2 : priority === "high" ? 1 : 0;
}
export function compareDispatchPriority(
  a: Incident,
  b: Incident,
  now = Date.now(),
): number {
  return (
    Number(isOverdue(b, now)) - Number(isOverdue(a, now)) ||
    priorityRank(b.priority) - priorityRank(a.priority) ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

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
  assigneeName = "",
  deadline,
  notes = "",
  reason,
  requireReason = false,
  now = Date.now(),
}: {
  unitName: string;
  assigneeName?: string;
  deadline: string;
  notes?: string;
  reason?: string;
  requireReason?: boolean;
  now?: number;
}):
  | {
      ok: true;
      deadlineIso: string;
      trimmedUnit: string;
      trimmedAssignee: string;
      trimmedNotes: string;
      trimmedReason: string;
    }
  | { ok: false; error: string } {
  const trimmedUnit = unitName.trim();
  if (!trimmedUnit)
    return { ok: false, error: "Vui lòng chọn đơn vị phụ trách." };
  const trimmedAssignee = assigneeName.trim();
  if (trimmedAssignee && !isStaffInUnit(trimmedUnit, trimmedAssignee))
    return {
      ok: false,
      error: "Cán bộ phụ trách không thuộc đơn vị đã chọn. Vui lòng chọn lại.",
    };
  if (!deadline.trim())
    return { ok: false, error: "Vui lòng nhập hạn hoàn thành cụ thể." };
  const parsed = Date.parse(deadline);
  if (!Number.isFinite(parsed))
    return {
      ok: false,
      error: "Hạn hoàn thành không đúng định dạng ngày giờ.",
    };
  if (parsed <= now)
    return {
      ok: false,
      error: "Hạn hoàn thành phải sau thời điểm hiện tại.",
    };
  const trimmedNotes = notes.trim();
  if (trimmedNotes.length > 1500)
    return { ok: false, error: "Ghi chú giao việc tối đa 1500 ký tự." };
  const trimmedReason = reason?.trim() || "";
  if (requireReason && trimmedReason.length < 3)
    return {
      ok: false,
      error: "Vui lòng nhập lý do điều chỉnh phân công (tối thiểu 3 ký tự).",
    };
  if (trimmedReason.length > 500)
    return { ok: false, error: "Lý do điều chỉnh tối đa 500 ký tự." };
  return {
    ok: true,
    deadlineIso: new Date(parsed).toISOString(),
    trimmedUnit,
    trimmedAssignee,
    trimmedNotes,
    trimmedReason,
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
  const onTimeCount = withDeadline.filter(
    (i) =>
      Date.parse(i.resolution!.resolvedAt) <=
      Date.parse(i.assignedTo!.deadline),
  ).length;
  return {
    total: items.length,
    totalReportsCount: items.reduce((sum, i) => sum + i.sameReportsCount, 0),
    pending: items.filter((i) => i.status === "pending").length,
    assigned: items.filter((i) => i.status === "assigned").length,
    inProgress: items.filter((i) => i.status === "in_progress").length,
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
    averageDaysCount: durations.length,
    averageRating: rated.length
      ? rated.reduce((sum, i) => sum + i.rating!.stars, 0) / rated.length
      : null,
    rated: rated.length,
    onTime: withDeadline.length
      ? (onTimeCount / withDeadline.length) * 100
      : null,
    onTimeCount,
    onTimeTotal: withDeadline.length,
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

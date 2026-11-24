import { create } from "zustand";
import type {
  Incident,
  IncidentCategory,
  IncidentStatus,
  NewIncidentInput,
  UserRole,
  IncidentPriority,
} from "../types/incident.ts";
import { generateMockIncidents } from "../data/mockIncidents.ts";
import {
  CATEGORIES,
  distanceMeters,
  findUnitStaffMember,
  isComplete,
  isStaffInUnit,
  safeImageUrl,
  validCoordinates,
} from "../lib/incidents.ts";

export const STORAGE_KEY = "tran_bien_smart_incidents_v1";
const dateValid = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
export function parseIncidents(raw: string): Incident[] {
  const data = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    !data.every(
      (i) =>
        i &&
        typeof i.id === "string" &&
        typeof i.code === "string" &&
        typeof i.title === "string" &&
        typeof i.description === "string" &&
        Object.hasOwn(CATEGORIES, i.category) &&
        ["pending", "assigned", "in_progress", "resolved", "closed"].includes(
          i.status,
        ) &&
        ["normal", "high", "urgent"].includes(i.priority) &&
        i.location &&
        validCoordinates(i.location.lat, i.location.lng) &&
        typeof i.location.address === "string" &&
        i.sender &&
        typeof i.sender.name === "string" &&
        typeof i.sender.phone === "string" &&
        Array.isArray(i.photosBefore) &&
        i.photosBefore.every((p: unknown) => !!safeImageUrl(p)) &&
        (!i.photosAfter ||
          (Array.isArray(i.photosAfter) &&
            i.photosAfter.every((p: unknown) => !!safeImageUrl(p)))) &&
        Number.isInteger(i.sameReportsCount) &&
        i.sameReportsCount > 0 &&
        dateValid(i.createdAt) &&
        dateValid(i.updatedAt) &&
        (!i.assignedTo ||
          (typeof i.assignedTo.unitName === "string" &&
            (i.assignedTo.assigneeId === undefined ||
              typeof i.assignedTo.assigneeId === "string") &&
            (i.assignedTo.assigneeName === undefined ||
              typeof i.assignedTo.assigneeName === "string") &&
            dateValid(i.assignedTo.assignedAt) &&
            dateValid(i.assignedTo.deadline))) &&
        (!i.assignmentHistory ||
          (Array.isArray(i.assignmentHistory) &&
            i.assignmentHistory.every(
              (h: any) =>
                h &&
                dateValid(h.changedAt) &&
                typeof h.changedBy === "string" &&
                typeof h.reason === "string" &&
                h.before &&
                typeof h.before.unitName === "string" &&
                h.after &&
                typeof h.after.unitName === "string",
            ))) &&
        (!i.resolution ||
          (typeof i.resolution.notes === "string" &&
            dateValid(i.resolution.resolvedAt))) &&
        (!i.rating ||
          (Number.isInteger(i.rating.stars) &&
            i.rating.stars >= 1 &&
            i.rating.stars <= 5 &&
            dateValid(i.rating.ratedAt))) &&
        (!i.linkedReports ||
          (Array.isArray(i.linkedReports) &&
            i.linkedReports.every(
              (r: any) =>
                r.sender &&
                typeof r.sender.phone === "string" &&
                typeof r.sender.name === "string" &&
                Array.isArray(r.photos) &&
                r.photos.every((p: unknown) => !!safeImageUrl(p)) &&
                dateValid(r.reportedAt),
            ))),
    )
  ) {
    throw new Error(
      "Dữ liệu demo không hợp lệ. Bản lưu được giữ nguyên; hãy khôi phục dữ liệu mẫu nếu cần.",
    );
  }
  if (new Set(data.map((i) => i.id)).size !== data.length)
    throw new Error("Dữ liệu có mã hồ sơ trùng. Vui lòng khôi phục bản mẫu.");
  return data;
}

export type AdminMapFilter =
  | "open"
  | "all"
  | "pending"
  | "assigned"
  | "in_progress"
  | "overdue"
  | "completed";

export interface MapScreenState {
  filter: AdminMapFilter;
  category: IncidentCategory | "all";
  query: string;
  urgentOnly: boolean;
  unit: string;
  month: string;
  center: [number, number] | null;
  zoom: number | null;
}

interface DispatchOptions {
  expectedUpdatedAt?: string;
  category?: IncidentCategory;
  priority?: IncidentPriority;
  assigneeId?: string;
  assigneeName?: string;
  notes?: string;
  deadline?: string;
}

interface ReassignOptions extends DispatchOptions {
  unitName: string;
  reason: string;
  changedBy?: string;
}

interface IncidentStore {
  incidents: Incident[];
  storageError: string | null;
  lastSyncedAt: string;
  syncNotice: string;
  currentRole: UserRole;
  elderlyMode: boolean;
  selectedIncidentId: string | null;
  mapScreenState: MapScreenState;
  setMapScreenState: (patch: Partial<MapScreenState>) => void;
  activeCitizenTab: "submit" | "my-reports" | "map";
  searchQuery: string;
  categoryFilter: IncidentCategory | "all";
  statusFilter: IncidentStatus | "all";
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setCurrentRole: (role: UserRole) => void;
  setElderlyMode: (enabled: boolean) => void;
  toggleElderlyMode: () => void;
  setSelectedIncidentId: (id: string | null) => void;
  setActiveCitizenTab: (tab: "submit" | "my-reports" | "map") => void;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: IncidentCategory | "all") => void;
  setStatusFilter: (s: IncidentStatus | "all") => void;
  addIncident: (input: NewIncidentInput) => {
    incident: Incident;
    isDuplicateGrouped: boolean;
    existingCode?: string;
  };
  assignIncident: (
    id: string,
    unit: string,
    days: number,
    officer?: string,
    options?: DispatchOptions,
  ) => void;
  reassignIncident: (id: string, options: ReassignOptions) => void;
  startIncident: (id: string) => void;
  verifyIncident: (id: string, notes?: string) => void;
  resolveIncident: (
    id: string,
    notes: string,
    photos: string[],
    officer?: string,
  ) => void;
  rateIncident: (
    id: string,
    stars: number,
    criteria: string[],
    comment?: string,
  ) => void;
  upvoteIncident: (id: string) => void;
  addIncidentPhotos: (id: string, newPhotos: string[]) => void;
  updateIncidentDescription: (id: string, description: string, title?: string) => void;
  updateIncident: (
    id: string,
    patch: Partial<Pick<Incident, "title" | "description" | "category" | "location" | "photosBefore">>,
  ) => void;
  deleteIncident: (id: string) => void;
  resetToDefaultData: () => void;
}
let initial: Incident[] = [];
let initialError: string | null = null;
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  initial = raw === null ? generateMockIncidents() : parseIncidents(raw);
  if (raw === null) localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
} catch (error) {
  initialError =
    error instanceof Error ? error.message : "Không đọc được dữ liệu demo.";
}

class StorageFailureError extends Error {}

function save(items: Incident[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    throw new StorageFailureError(
      "Chưa lưu được: bộ nhớ trình duyệt đầy hoặc bị chặn. Giữ lại nội dung và thử ảnh nhỏ hơn.",
    );
  }
}
// shortcut: localStorage không có giao dịch; chuyển sang backend trước khi dùng nhiều thiết bị hoặc ghi đồng thời.
function mutate(update: (items: Incident[]) => Incident[]) {
  let latest: Incident[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null)
      throw new StorageFailureError(
        "Bản lưu demo đã bị xóa. Hãy khôi phục dữ liệu mẫu trước khi tiếp tục.",
      );
    try {
      latest = parseIncidents(raw);
    } catch (parseError) {
      throw new StorageFailureError(
        parseError instanceof Error
          ? parseError.message
          : "Dữ liệu demo không hợp lệ.",
      );
    }
    const updated = update(latest);
    save(updated);
    useIncidentStore.setState({
      incidents: updated,
      storageError: null,
      lastSyncedAt: new Date().toISOString(),
      syncNotice: "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không lưu được thay đổi.";
    if (error instanceof StorageFailureError) {
      useIncidentStore.setState({ storageError: message });
    } else if (latest) {
      // Nếu lỗi do xung đột dữ liệu mới từ tab khác, nạp bản mới nhất để cán bộ xem lại.
      useIncidentStore.setState({
        incidents: latest,
        lastSyncedAt: new Date().toISOString(),
      });
    }
    throw new Error(message);
  }
}
function changeIncident(id: string, change: (item: Incident) => Incident) {
  mutate((items) => {
    if (!items.some((i) => i.id === id))
      throw new Error("Hồ sơ không còn tồn tại. Vui lòng quay lại danh sách.");
    return items.map((i) =>
      i.id === id ? { ...change(i), updatedAt: new Date().toISOString() } : i,
    );
  });
}
export const useIncidentStore = create<IncidentStore>((set, get) => ({
  incidents: initial,
  storageError: initialError,
  lastSyncedAt: new Date().toISOString(),
  syncNotice: "",
  currentRole: "citizen",
  elderlyMode: false,
  selectedIncidentId: null,
  mapScreenState: {
    filter: "open",
    category: "all",
    query: "",
    urgentOnly: false,
    unit: "all",
    month: "",
    center: null,
    zoom: null,
  },
  setMapScreenState: (patch) =>
    set((s) => ({ mapScreenState: { ...s.mapScreenState, ...patch } })),
  activeCitizenTab: "my-reports",
  searchQuery: "",
  categoryFilter: "all",
  statusFilter: "all",
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setElderlyMode: (elderlyMode) => {
    document.body.classList.toggle("elderly-mode", elderlyMode);
    set({ elderlyMode });
  },
  toggleElderlyMode: () => get().setElderlyMode(!get().elderlyMode),
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  setActiveCitizenTab: (activeCitizenTab) => set({ activeCitizenTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  addIncident: (input) => {
    if (
      !Object.hasOwn(CATEGORIES, input.category) ||
      !validCoordinates(input.location.lat, input.location.lng) ||
      !input.location.address.trim() ||
      !input.description.trim() ||
      !/^0\d{9}$/.test(input.senderPhone.replace(/[\s.]/g, "")) ||
      !input.photosBefore.length ||
      input.photosBefore.some((p) => !safeImageUrl(p))
    )
      throw new Error(
        "Kiểm tra ảnh, vị trí, mô tả và số điện thoại 10 chữ số.",
      );
    let result!: {
      incident: Incident;
      isDuplicateGrouped: boolean;
      existingCode?: string;
    };
    mutate((items) => {
      const now = new Date().toISOString();
      const sender = {
        name: input.senderName?.trim() || "Người dân",
        phone: input.senderPhone.replace(/[\s.]/g, ""),
      };
      if (input.duplicateOf) {
        const duplicate = items.find(
          (i) =>
            i.id === input.duplicateOf &&
            i.category === input.category &&
            !isComplete(i) &&
            distanceMeters(i.location, input.location) <= 50,
        );
        if (!duplicate)
          throw new Error(
            "Hồ sơ gợi ý gộp đã thay đổi. Vui lòng xem lại trước khi gửi.",
          );
        const updated = {
          ...duplicate,
          sameReportsCount: duplicate.sameReportsCount + 1,
          linkedReports: [
            ...(duplicate.linkedReports || []),
            { sender, photos: input.photosBefore, reportedAt: now },
          ],
          updatedAt: now,
        };
        result = {
          incident: updated,
          isDuplicateGrouped: true,
          existingCode: duplicate.code,
        };
        return items.map((i) => (i.id === duplicate.id ? updated : i));
      }
      const number =
        Math.max(
          0,
          ...items.map((i) => Number(i.code.split("-").at(-1)) || 0),
        ) + 1;
      const incident: Incident = {
        id: crypto.randomUUID(),
        code: `TB-2026-${String(number).padStart(3, "0")}`,
        title:
          input.title?.trim() ||
          `${CATEGORIES[input.category]}: ${input.description.slice(0, 65)}`,
        description: input.description.trim(),
        category: input.category,
        status: "pending",
        priority: "normal",
        location: input.location,
        sender,
        photosBefore: input.photosBefore,
        sameReportsCount: 1,
        createdAt: now,
        updatedAt: now,
      };
      result = { incident, isDuplicateGrouped: false };
      return [incident, ...items];
    });
    set({ selectedIncidentId: result.incident.id });
    return result;
  },
  assignIncident: (
    id,
    unitName,
    days,
    officerName = "Cán bộ tiếp nhận",
    options = {},
  ) => {
    const trimmedUnit = unitName.trim();
    const trimmedNotes = options.notes?.trim();
    const rawAssignee = options.assigneeName?.trim() || options.assigneeId?.trim() || "";
    if (rawAssignee && !isStaffInUnit(trimmedUnit, rawAssignee))
      throw new Error(
        "Cán bộ phụ trách không thuộc đơn vị đã chọn. Vui lòng kiểm tra lại.",
      );
    const staffMember = rawAssignee
      ? findUnitStaffMember(trimmedUnit, rawAssignee)
      : undefined;
    if (trimmedNotes && trimmedNotes.length > 1500)
      throw new Error("Ghi chú giao việc tối đa 1500 ký tự.");
    const deadline =
      options.deadline !== undefined
        ? options.deadline
        : new Date(Date.now() + days * 86400000).toISOString();
    if (
      !trimmedUnit ||
      !dateValid(deadline) ||
      Date.parse(deadline) <= Date.now()
    )
      throw new Error("Chọn đơn vị và hạn xử lý sau thời điểm hiện tại.");
    if (options.category && !Object.hasOwn(CATEGORIES, options.category))
      throw new Error("Loại sự cố không hợp lệ.");
    if (
      options.priority &&
      !["normal", "high", "urgent"].includes(options.priority)
    )
      throw new Error("Mức độ không hợp lệ.");
    changeIncident(id, (item) => {
      if (
        options.expectedUpdatedAt &&
        item.updatedAt !== options.expectedUpdatedAt
      )
        throw new Error(
          "Hồ sơ vừa thay đổi ở tab khác. Hãy xem lại thông tin mới trước khi giao.",
        );
      if (item.status !== "pending")
        throw new Error(
          "Hồ sơ đã được giao hoặc hoàn tất. Vui lòng xem trạng thái mới nhất.",
        );
      return {
        ...item,
        category: options.category || item.category,
        priority: options.priority || item.priority,
        status: "assigned",
        assignedTo: {
          unitName: trimmedUnit,
          officerName,
          assigneeId: staffMember?.id,
          assigneeName: staffMember?.name,
          assignedAt: new Date().toISOString(),
          deadline,
          notes: trimmedNotes,
        },
      };
    });
  },
  reassignIncident: (id, options) => {
    const trimmedUnit = options.unitName.trim();
    const trimmedReason = options.reason.trim();
    const trimmedNotes = options.notes?.trim();
    const rawAssignee =
      options.assigneeName?.trim() || options.assigneeId?.trim() || "";
    if (trimmedReason.length < 3 || trimmedReason.length > 500)
      throw new Error("Nhập lý do điều chỉnh phân công (3–500 ký tự).");
    if (rawAssignee && !isStaffInUnit(trimmedUnit, rawAssignee))
      throw new Error(
        "Cán bộ phụ trách không thuộc đơn vị đã chọn. Vui lòng kiểm tra lại.",
      );
    const staffMember = rawAssignee
      ? findUnitStaffMember(trimmedUnit, rawAssignee)
      : undefined;
    if (trimmedNotes && trimmedNotes.length > 1500)
      throw new Error("Ghi chú giao việc tối đa 1500 ký tự.");
    const deadline = options.deadline || "";
    if (
      !trimmedUnit ||
      !dateValid(deadline) ||
      Date.parse(deadline) <= Date.now()
    )
      throw new Error("Chọn đơn vị và hạn xử lý sau thời điểm hiện tại.");
    if (options.category && !Object.hasOwn(CATEGORIES, options.category))
      throw new Error("Loại sự cố không hợp lệ.");
    if (
      options.priority &&
      !["normal", "high", "urgent"].includes(options.priority)
    )
      throw new Error("Mức độ không hợp lệ.");
    changeIncident(id, (item) => {
      if (
        options.expectedUpdatedAt &&
        item.updatedAt !== options.expectedUpdatedAt
      )
        throw new Error(
          "Hồ sơ vừa thay đổi ở tab khác. Hãy xem lại thông tin mới trước khi điều chỉnh.",
        );
      if (
        (item.status !== "assigned" && item.status !== "in_progress") ||
        !item.assignedTo
      )
        throw new Error(
          "Chỉ được điều chỉnh phân công cho hồ sơ đã giao hoặc đang xử lý.",
        );
      const nextCategory = options.category || item.category;
      const nextPriority = options.priority || item.priority;
      const before = {
        unitName: item.assignedTo.unitName,
        assigneeName: item.assignedTo.assigneeName,
        deadline: item.assignedTo.deadline,
        notes: item.assignedTo.notes,
        category: item.category,
        priority: item.priority,
      };
      const after = {
        unitName: trimmedUnit,
        assigneeName: staffMember?.name,
        deadline,
        notes: trimmedNotes,
        category: nextCategory,
        priority: nextPriority,
      };
      const changed =
        before.unitName !== after.unitName ||
        (before.assigneeName || "") !== (after.assigneeName || "") ||
        before.deadline !== after.deadline ||
        (before.notes || "") !== (after.notes || "") ||
        before.category !== after.category ||
        before.priority !== after.priority;
      if (!changed)
        throw new Error("Chưa có thay đổi nào so với phân công hiện tại.");
      const record = {
        changedAt: new Date().toISOString(),
        changedBy: options.changedBy?.trim() || "Cán bộ điều phối",
        reason: trimmedReason,
        before,
        after,
      };
      return {
        ...item,
        category: nextCategory,
        priority: nextPriority,
        assignedTo: {
          ...item.assignedTo,
          unitName: trimmedUnit,
          officerName: options.changedBy?.trim() || item.assignedTo.officerName,
          assigneeId: staffMember?.id,
          assigneeName: staffMember?.name,
          deadline,
          notes: trimmedNotes,
        },
        assignmentHistory: [record, ...(item.assignmentHistory || [])],
      };
    });
  },
  startIncident: (id) =>
    changeIncident(id, (item) => {
      if (item.status !== "assigned" || !item.assignedTo)
        throw new Error("Chỉ bắt đầu hồ sơ đã được phân công.");
      return { ...item, status: "in_progress" };
    }),
  verifyIncident: (id, notes) =>
    changeIncident(id, (item) => {
      if (isComplete(item)) throw new Error("Hồ sơ đã hoàn tất.");
      if (!notes?.trim()) throw new Error("Nhập nội dung xác minh tại chỗ.");
      return {
        ...item,
        verifiedByVolunteer: true,
        verificationNotes: notes.trim(),
      };
    }),
  resolveIncident: (id, notes, photosAfter, officerName = "Tổ hiện trường") => {
    if (
      !notes.trim() ||
      !photosAfter.length ||
      photosAfter.some((p) => !safeImageUrl(p))
    )
      throw new Error("Cần ảnh sau xử lý và nội dung khắc phục.");
    changeIncident(id, (item) => {
      if (item.status !== "in_progress" || !item.assignedTo)
        throw new Error("Hãy nhận và bắt đầu nhiệm vụ trước khi hoàn tất.");
      return {
        ...item,
        status: "resolved",
        photosAfter,
        resolution: {
          notes: notes.trim(),
          officerName,
          resolvedAt: new Date().toISOString(),
        },
      };
    });
  },
  rateIncident: (id, stars, criteria, comment) => {
    if (!Number.isInteger(stars) || stars < 1 || stars > 5)
      throw new Error("Chọn đánh giá từ 1 đến 5 sao.");
    changeIncident(id, (item) => {
      if (item.status !== "resolved" && item.status !== "closed")
        throw new Error("Hồ sơ chưa hoàn tất nên chưa thể đánh giá.");
      return {
        ...item,
        status: "closed",
        rating: { stars, criteria, comment, ratedAt: new Date().toISOString() },
      };
    });
  },
  upvoteIncident: (id) =>
    changeIncident(id, (item) => ({
      ...item,
      sameReportsCount: item.sameReportsCount + 1,
    })),
  addIncidentPhotos: (id, newPhotos) => {
    if (!newPhotos.length) return;
    changeIncident(id, (item) => ({
      ...item,
      photosBefore: [...item.photosBefore, ...newPhotos],
    }));
  },
  updateIncidentDescription: (id, description, title) => {
    changeIncident(id, (item) => ({
      ...item,
      ...(title ? { title } : {}),
      description,
    }));
  },
  updateIncident: (id, patch) => {
    changeIncident(id, (item) => ({
      ...item,
      ...patch,
    }));
  },
  deleteIncident: (id) => {
    try {
      const updated = get().incidents.filter((item) => item.id !== id);
      save(updated);
      set({
        incidents: updated,
        storageError: null,
        selectedIncidentId: get().selectedIncidentId === id ? null : get().selectedIncidentId,
        lastSyncedAt: new Date().toISOString(),
        syncNotice: "Đã hủy một hồ sơ phản ánh.",
      });
    } catch (error) {
      set({ storageError: (error as Error).message });
    }
  },
  resetToDefaultData: () => {
    try {
      const items = generateMockIncidents();
      save(items);
      set({
        incidents: items,
        storageError: null,
        selectedIncidentId: null,
        lastSyncedAt: new Date().toISOString(),
        syncNotice: "Đã khôi phục 64 hồ sơ mẫu.",
      });
    } catch (error) {
      set({ storageError: (error as Error).message });
    }
  },
}));

function syncFromStorage(event: StorageEvent) {
  if (
    event.storageArea !== localStorage ||
    (event.key !== STORAGE_KEY && event.key !== null)
  )
    return;
  try {
    if (!event.newValue)
      throw new Error(
        "Bản lưu demo đã bị xóa ở tab khác. Dữ liệu đang xem được giữ lại; hãy khôi phục mẫu để tiếp tục.",
      );
    const incidents = parseIncidents(event.newValue);
    const previous = useIncidentStore.getState().incidents;
    const added = incidents.filter(
      (i) => !previous.some((old) => old.id === i.id),
    ).length;
    useIncidentStore.setState({
      incidents,
      storageError: null,
      lastSyncedAt: new Date().toISOString(),
      syncNotice: added
        ? `Có ${added} phản ánh mới từ tab khác.`
        : "Hồ sơ vừa được cập nhật từ tab khác.",
    });
  } catch (error) {
    useIncidentStore.setState({ storageError: (error as Error).message });
  }
}
window.addEventListener("storage", syncFromStorage);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener("storage", syncFromStorage),
  );

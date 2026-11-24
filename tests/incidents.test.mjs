import assert from "node:assert/strict";
import { test } from "node:test";
import { generateMockIncidents } from "../src/data/mockIncidents.ts";
import {
  incidentStats,
  isOverdue,
  safeImageUrl,
  distanceMeters,
  deadlineLabel,
  getIncidentMapVisual,
  getAssigneeLabel,
  isStaffInUnit,
  MAP_STATUS_ORDER,
  MAP_STATUS_VISUALS,
  UNASSIGNED_STAFF_LABEL,
  UNITS,
  validateDispatchInput,
} from "../src/lib/incidents.ts";

const values = new Map();
let failWrite = false;
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => {
    if (failWrite) throw new Error("QuotaExceededError");
    values.set(key, value);
  },
};
globalThis.window = new EventTarget();
const { useIncidentStore, STORAGE_KEY, parseIncidents } = await import(
  "../src/store/useIncidentStore.ts"
);
const store = () => useIncidentStore.getState();
const input = {
  category: "waste",
  description: "Rác chắn lối đi — kiểm thử",
  location: { lat: 10.95, lng: 106.82, address: "Điểm demo" },
  senderPhone: "0988555666",
  photosBefore: ["https://example.com/before.jpg"],
};

test("seed and statistics use consistent counts, dates and categories", () => {
  const seed = generateMockIncidents();
  assert.deepEqual(seed, generateMockIncidents());
  assert.equal(seed.length, 64);
  assert.equal(incidentStats(seed).completed, 47);
  assert.equal(incidentStats(seed).averageDays.toFixed(1), "3.2");
  for (const [category, count] of Object.entries({
    street_light: 18,
    flooding: 15,
    waste: 21,
    road_damage: 10,
  }))
    assert.equal(seed.filter((i) => i.category === category).length, count);
  assert.equal(incidentStats([]).averageRating, null);
  assert.equal(incidentStats([]).onTime, null);
  assert.equal(
    isOverdue(
      seed.find((i) => i.status === "closed"),
      Date.now(),
    ),
    false,
  );
});
test("parser accepts empty data and rejects malformed records and unsafe media", () => {
  assert.deepEqual(parseIncidents("[]"), []);
  for (const raw of [
    "{}",
    "null",
    "broken",
    "[{}]",
    JSON.stringify([
      {
        ...generateMockIncidents()[0],
        location: { lat: 999, lng: 1, address: "x" },
      },
    ]),
  ])
    assert.throws(() => parseIncidents(raw));
  assert.equal(safeImageUrl("javascript:alert(1)"), "");
  assert.equal(safeImageUrl("data:image/svg+xml;base64,PHN2Zz4="), "");
  assert.equal(distanceMeters(input.location, input.location), 0);
});
test("complete workflow validates transitions and preserves dispatch notes", () => {
  store().resetToDefaultData();
  const added = store().addIncident(input).incident;
  assert.throws(() => store().startIncident(added.id));
  store().verifyIncident(added.id, "Có rác thực tế");
  assert.equal(
    store().incidents.find((i) => i.id === added.id).status,
    "pending",
  );
  assert.throws(() => store().assignIncident("missing", "Tổ demo", 3));
  assert.throws(() =>
    store().assignIncident(added.id, "Tổ demo", 3, "Cán bộ", {
      expectedUpdatedAt: "stale",
    }),
  );
  store().assignIncident(added.id, "Tổ vệ sinh", 3, "Cán bộ demo", {
    notes: "Thu gom trước giờ tan học",
    priority: "high",
  });
  const assigned = store().incidents.find((i) => i.id === added.id);
  assert.equal(assigned.assignedTo.notes, "Thu gom trước giờ tan học");
  assert.throws(() => store().assignIncident(added.id, "Đội khác", 3));
  assert.throws(() =>
    store().resolveIncident(added.id, "Xong", [
      "https://example.com/after.jpg",
    ]),
  );
  store().startIncident(added.id);
  assert.throws(() => store().resolveIncident(added.id, "Xong", []));
  store().resolveIncident(added.id, "Đã thu gom", [
    "https://example.com/after.jpg",
  ]);
  assert.throws(() => store().rateIncident(added.id, 6, []));
  store().rateIncident(added.id, 2, [], "Cần nhanh hơn");
  assert.equal(
    store().incidents.find((i) => i.id === added.id).rating.stars,
    2,
  );
  assert.throws(() => store().rateIncident(added.id, 5, []));
  assert.throws(() => store().verifyIncident(added.id, "Muộn"));
});
test("duplicate linking requires explicit confirmation and keeps sender and photo", () => {
  store().resetToDefaultData();
  const first = store().addIncident(input).incident;
  const separate = store().addIncident(input).incident;
  assert.notEqual(first.id, separate.id);
  const linked = store().addIncident({
    ...input,
    duplicateOf: first.id,
    senderPhone: "0901111222",
  });
  assert.equal(linked.isDuplicateGrouped, true);
  assert.equal(linked.incident.linkedReports[0].sender.phone, "0901111222");
  assert.equal(
    linked.incident.linkedReports[0].photos[0],
    input.photosBefore[0],
  );
  assert.equal(linked.incident.priority, "normal");
});
test("storage sync refreshes tabs; mutations preserve latest snapshot; quota failure does not report success", () => {
  store().resetToDefaultData();
  const first = store().addIncident(input).incident;
  const external = structuredClone(store().incidents);
  external[0].description = "Cập nhật từ tab khác";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(external));
  const event = new Event("storage");
  Object.assign(event, {
    key: STORAGE_KEY,
    newValue: JSON.stringify(external),
    storageArea: localStorage,
  });
  window.dispatchEvent(event);
  assert.equal(store().incidents[0].description, "Cập nhật từ tab khác");
  assert.match(store().syncNotice, /tab khác/);
  const extra = { ...external[0], id: "external-tab-id", code: "TB-2026-999" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([extra, ...external]));
  store().assignIncident(first.id, "Tổ vệ sinh", 3);
  assert(store().incidents.some((i) => i.id === extra.id));
  const before = store().incidents;
  failWrite = true;
  assert.throws(() => store().addIncident(input), /Chưa lưu được/);
  assert.equal(store().incidents, before);
  failWrite = false;
  localStorage.setItem(STORAGE_KEY, "corrupt");
  assert.throws(() => store().upvoteIncident(first.id));
  assert.equal(localStorage.getItem(STORAGE_KEY), "corrupt");
});

test("deadline uses whole days consistently when views refresh seconds apart", () => {
  const item = generateMockIncidents().find((i) => i.status === "assigned");
  const now = Date.parse("2026-11-24T04:39:00Z");
  item.assignedTo.deadline = new Date(now + 3 * 86400000).toISOString();
  assert.equal(deadlineLabel(item, now - 30000), "Còn 3 ngày");
  assert.equal(deadlineLabel(item, now + 30000), "Còn 3 ngày");
});

test("dispatch validation rejects empty, malformed, past deadlines and long notes", () => {
  const now = Date.parse("2026-11-24T05:00:00Z");
  assert.equal(
    validateDispatchInput({ unitName: " ", deadline: "2026-11-25T10:00", now })
      .ok,
    false,
  );
  assert.equal(
    validateDispatchInput({ unitName: "Tổ vệ sinh", deadline: "", now }).ok,
    false,
  );
  assert.equal(
    validateDispatchInput({
      unitName: "Tổ vệ sinh",
      deadline: "not-a-date",
      now,
    }).ok,
    false,
  );
  assert.equal(
    validateDispatchInput({
      unitName: "Tổ vệ sinh",
      deadline: "2026-11-24T04:59:00Z",
      now,
    }).ok,
    false,
  );
  assert.equal(
    validateDispatchInput({
      unitName: "Tổ vệ sinh",
      deadline: "2026-11-25T10:00:00Z",
      notes: "a".repeat(1501),
      now,
    }).ok,
    false,
  );
  const ok = validateDispatchInput({
    unitName: "  Tổ vệ sinh môi trường  ",
    deadline: "2026-11-26T09:30:00Z",
    notes: "  Thu gom trong ngày  ",
    now,
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.trimmedUnit, "Tổ vệ sinh môi trường");
    assert.equal(ok.trimmedNotes, "Thu gom trong ngày");
    assert.equal(ok.deadlineIso, "2026-11-26T09:30:00.000Z");
  }
});

test("map status visuals distinguish statuses by color, symbol and legend", () => {
  const now = Date.parse("2026-11-24T05:00:00Z");
  const base = generateMockIncidents()[0];
  const pending = {
    ...base,
    status: "pending",
    priority: "normal",
    assignedTo: undefined,
  };
  const active = {
    ...base,
    status: "assigned",
    priority: "normal",
    assignedTo: {
      unitName: "Tổ chiếu sáng",
      assignedAt: "2026-11-24T01:00:00Z",
      deadline: "2026-11-27T01:00:00Z",
    },
  };
  const overdue = {
    ...active,
    assignedTo: {
      ...active.assignedTo,
      deadline: "2026-11-20T01:00:00Z",
    },
  };
  const completed = { ...base, status: "resolved" };
  const visuals = [pending, active, overdue, completed].map((item) =>
    getIncidentMapVisual(item, now),
  );
  assert.deepEqual(
    visuals.map((v) => v.key),
    MAP_STATUS_ORDER,
  );
  assert.equal(new Set(visuals.map((v) => v.color)).size, 4);
  assert.equal(new Set(visuals.map((v) => v.symbol)).size, 4);
  for (const v of visuals) {
    assert.deepEqual(MAP_STATUS_VISUALS[v.key], v);
  }
});

test("cross-tab conflict refreshes store for review without triggering storageError and blocks repeat dispatch", () => {
  store().resetToDefaultData();
  const added = store().addIncident(input).incident;
  const staleVersion = added.updatedAt;
  // Mô phỏng tab khác cập nhật hồ sơ trong localStorage trước khi tab hiện tại gửi
  const external = structuredClone(store().incidents);
  const externalItem = external.find((i) => i.id === added.id);
  externalItem.verifiedByVolunteer = true;
  externalItem.verificationNotes = "Tab khác đã xác minh";
  externalItem.updatedAt = new Date(Date.now() + 5000).toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(external));

  assert.throws(
    () =>
      store().assignIncident(added.id, "Tổ vệ sinh môi trường", 3, "Cán bộ", {
        expectedUpdatedAt: staleVersion,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        notes: "Giữ ghi chú",
      }),
    /tab khác/,
  );
  assert.equal(store().storageError, null);
  const refreshed = store().incidents.find((i) => i.id === added.id);
  assert.equal(refreshed.verifiedByVolunteer, true);
  assert.equal(refreshed.verificationNotes, "Tab khác đã xác minh");

  // Sau khi xem bản mới, giao thành công; thao tác lặp lần 2 bị chặn
  store().assignIncident(added.id, "Tổ vệ sinh môi trường", 3, "Cán bộ", {
    expectedUpdatedAt: refreshed.updatedAt,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    notes: "Giao lần đầu",
  });
  assert.throws(
    () =>
      store().assignIncident(added.id, "Tổ thoát nước", 2, "Cán bộ", {
        deadline: new Date(Date.now() + 86400000).toISOString(),
        notes: "Giao trùng",
      }),
    /đã được giao/,
  );
  assert.equal(store().storageError, null);
  assert.equal(
    store().incidents.find((i) => i.id === added.id).assignedTo.unitName,
    "Tổ vệ sinh môi trường",
  );
});

test("legacy assignment without assignee displays unassigned label; unit-staff check and reassignment history work", () => {
  store().resetToDefaultData();
  const legacy = store().incidents.find((i) => i.assignedTo);
  assert.equal(legacy.assignedTo.assigneeName, undefined);
  assert.equal(getAssigneeLabel(legacy.assignedTo), UNASSIGNED_STAFF_LABEL);
  assert.ok(legacy.assignedTo.officerName);

  const added = store().addIncident(input).incident;
  const future1 = new Date(Date.now() + 2 * 86400000).toISOString();
  const future2 = new Date(Date.now() + 4 * 86400000).toISOString();

  // Cán bộ không thuộc đơn vị phải bị chặn
  assert.equal(isStaffInUnit(UNITS.waste, "Nguyễn Văn Hùng"), false);
  assert.throws(
    () =>
      store().assignIncident(added.id, UNITS.waste, 3, "Nguyễn Thành Long", {
        assigneeName: "Nguyễn Văn Hùng",
        deadline: future1,
      }),
    /không thuộc đơn vị/,
  );

  // Giao cho đơn vị trước (không tự gán ngẫu nhiên cá nhân)
  store().assignIncident(added.id, UNITS.waste, 3, "Nguyễn Thành Long", {
    deadline: future1,
    notes: "Giao đơn vị trước",
  });
  const firstAssigned = store().incidents.find((i) => i.id === added.id);
  assert.equal(firstAssigned.assignedTo.officerName, "Nguyễn Thành Long");
  assert.equal(firstAssigned.assignedTo.assigneeName, undefined);
  assert.equal(
    getAssigneeLabel(firstAssigned.assignedTo),
    UNASSIGNED_STAFF_LABEL,
  );

  // Điều chỉnh phân công bắt buộc có lý do và lưu lịch sử trước/sau
  assert.throws(
    () =>
      store().reassignIncident(added.id, {
        unitName: UNITS.flooding,
        assigneeName: "Phạm Minh Tuấn",
        deadline: future2,
        reason: "",
        changedBy: "Trần Văn Minh",
        expectedUpdatedAt: firstAssigned.updatedAt,
      }),
    /lý do/,
  );
  store().reassignIncident(added.id, {
    unitName: UNITS.flooding,
    assigneeName: "Phạm Minh Tuấn",
    deadline: future2,
    notes: "Phối hợp khơi thông cống",
    reason: "Hiện trường có ngập kèm rác",
    changedBy: "Trần Văn Minh",
    expectedUpdatedAt: firstAssigned.updatedAt,
  });
  const reassigned = store().incidents.find((i) => i.id === added.id);
  assert.equal(reassigned.assignedTo.unitName, UNITS.flooding);
  assert.equal(reassigned.assignedTo.assigneeName, "Phạm Minh Tuấn");
  assert.equal(reassigned.assignedTo.officerName, "Trần Văn Minh");
  assert.equal(reassigned.assignmentHistory.length, 1);
  assert.equal(reassigned.assignmentHistory[0].reason, "Hiện trường có ngập kèm rác");
  assert.equal(reassigned.assignmentHistory[0].before.unitName, UNITS.waste);
  assert.equal(reassigned.assignmentHistory[0].after.unitName, UNITS.flooding);
  assert.equal(reassigned.assignmentHistory[0].after.assigneeName, "Phạm Minh Tuấn");

  // Không cho điều chỉnh hồ sơ đã hoàn tất
  store().startIncident(added.id);
  store().resolveIncident(added.id, "Đã xử lý xong", [
    "https://example.com/after.jpg",
  ]);
  assert.throws(
    () =>
      store().reassignIncident(added.id, {
        unitName: UNITS.waste,
        deadline: future2,
        reason: "Thử sửa sau khi xong",
      }),
    /đã giao hoặc đang xử lý/,
  );
});

test("statistics totals match source records without double-counting overlapping groups", () => {
  const seed = generateMockIncidents();
  const s = incidentStats(seed);
  assert.equal(s.pending + s.assigned + s.inProgress + s.completed, s.total);
  assert.equal(s.assigned + s.inProgress, s.active);
  assert.ok(s.totalReportsCount > s.total);
  assert.equal(s.onTimeTotal, 47);
  assert.equal(s.onTimeCount, 47);
});

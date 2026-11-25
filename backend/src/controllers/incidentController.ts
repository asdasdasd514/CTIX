import type { Request, Response } from 'express';
import { IncidentModel, serializeIncident } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';

const CATEGORY_TITLES: Record<IncidentCategoryType, string> = {
  street_light: 'Sự cố đèn chiếu sáng đô thị',
  flooding: 'Sự cố ngập nước / cống thoát nước',
  waste: 'Sự cố rác thải / vệ sinh môi trường',
  road_damage: 'Sự cố hư hỏng mặt đường / ổ gà',
  other: 'Phản ánh sự cố hiện trường',
};

// GET /api/incidents (MOD-02, MOD-03, MOD-04, MOD-05)
export async function listIncidents(req: Request, res: Response) {
  try {
    const { status, category, onlyUnresolved, search } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (onlyUnresolved === 'true') {
      filter.status = { $nin: ['resolved', 'closed'] };
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { code: regex },
        { title: regex },
        { description: regex },
        { 'location.address': regex },
      ];
    }

    const docs = await IncidentModel.find(filter).sort({ createdAtIso: -1 });
    return res.json({
      incidents: docs.map(serializeIncident),
      total: docs.length,
    });
  } catch (err) {
    console.error('[Incidents] list error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách phản ánh.' });
  }
}

// GET /api/incidents/:id
export async function getIncidentById(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ phản ánh.' });
    }
    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] getById error:', err);
    return res.status(500).json({ message: 'Không thể tải chi tiết phản ánh.' });
  }
}

// POST /api/incidents (MOD-01: Công dân tạo phản ánh mới)
export async function createIncident(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      category,
      location,
      senderPhone,
      senderName,
      photosBefore,
    } = req.body;

    if (!description?.trim() || !category || !location?.address) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ loại sự cố, mô tả và vị trí phản ánh.',
      });
    }

    const nowIso = new Date().toISOString();
    const count = await IncidentModel.countDocuments();
    const nextNum = count + 1;
    const code = `TB-2026-${String(nextNum).padStart(3, '0')}`;
    const incidentId = `inc-${Date.now().toString(36)}-${nextNum}`;

    const lat = Number(location.lat) || 10.9572;
    const lng = Number(location.lng) || 106.8243;

    const doc = await IncidentModel.create({
      incidentId,
      code,
      title:
        title?.trim() ||
        `${CATEGORY_TITLES[category as IncidentCategoryType] || 'Phản ánh hiện trường'} tại ${location.address}`,
      description: description.trim(),
      category,
      status: 'pending',
      priority: 'normal',
      location: {
        lat,
        lng,
        address: location.address.trim(),
        ward: location.ward || 'Phường Trấn Biên',
        geo: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
      sender: {
        name: senderName?.trim() || 'Công dân Phường Trấn Biên',
        phone: senderPhone?.trim() || '0900000000',
      },
      photosBefore: Array.isArray(photosBefore) ? photosBefore : [],
      photosAfter: [],
      sameReportsCount: 1,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    });

    return res.status(201).json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] create error:', err);
    return res.status(500).json({ message: 'Không thể tạo phản ánh mới.' });
  }
}

// PATCH /api/incidents/:id (MOD-01: Công dân chỉnh sửa hồ sơ chưa xong)
export async function updateIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ phản ánh.' });
    }
    if (doc.status === 'resolved' || doc.status === 'closed') {
      return res.status(400).json({ message: 'Không thể chỉnh sửa hồ sơ đã hoàn thành.' });
    }

    const { title, description, category, location, photosBefore } = req.body;
    if (title !== undefined) doc.title = String(title).trim();
    if (description !== undefined) doc.description = String(description).trim();
    if (category !== undefined) doc.category = category;
    if (Array.isArray(photosBefore)) doc.photosBefore = photosBefore;
    if (location) {
      const lat = Number(location.lat) || doc.location.lat;
      const lng = Number(location.lng) || doc.location.lng;
      doc.location = {
        lat,
        lng,
        address: location.address || doc.location.address,
        ward: location.ward || doc.location.ward || 'Phường Trấn Biên',
        geo: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      };
    }

    doc.updatedAtIso = new Date().toISOString();
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] update error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật hồ sơ phản ánh.' });
  }
}

// DELETE /api/incidents/:id (MOD-01: Công dân hủy phản ánh)
export async function deleteIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ phản ánh.' });
    }
    if (doc.status === 'resolved' || doc.status === 'closed') {
      return res.status(400).json({ message: 'Không thể hủy hồ sơ đã được xử lý xong.' });
    }
    await IncidentModel.deleteOne({ _id: doc._id });
    return res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[Incidents] delete error:', err);
    return res.status(500).json({ message: 'Không thể hủy phản ánh.' });
  }
}

// POST /api/incidents/:id/upvote (MOD-02: Đồng phản ánh)
export async function upvoteIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });

    doc.sameReportsCount = (doc.sameReportsCount || 1) + 1;
    doc.updatedAtIso = new Date().toISOString();
    await doc.save();
    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] upvote error:', err);
    return res.status(500).json({ message: 'Không thể ghi nhận đồng phản ánh.' });
  }
}

// POST /api/incidents/:id/rating (MOD-02: Đánh giá hài lòng 1-5 sao)
export async function rateIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status !== 'resolved' && doc.status !== 'closed') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá sau khi hồ sơ đã xử lý xong.' });
    }

    const { stars, comment, criteria } = req.body;
    const score = Number(stars);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Số sao đánh giá phải từ 1 đến 5.' });
    }

    const nowIso = new Date().toISOString();
    doc.rating = {
      stars: score,
      comment: comment?.trim() || undefined,
      criteria: Array.isArray(criteria) ? criteria : [],
      ratedAt: nowIso,
    };
    doc.status = 'closed';
    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] rate error:', err);
    return res.status(500).json({ message: 'Không thể lưu đánh giá hài lòng.' });
  }
}

// POST /api/incidents/:id/assign (MOD-04: Phân công Cá nhân / Tổ đội)
export async function assignIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status === 'resolved' || doc.status === 'closed') {
      return res.status(400).json({ message: 'Hồ sơ đã hoàn tất, không thể phân công lại.' });
    }

    const {
      unitName,
      deadlineDays = 2,
      officerName = 'Nguyễn Thành Long',
      priority,
      category,
      assigneeId,
      assigneeName,
      notes,
      reason,
      expectedUpdatedAt,
      workflowSteps,
    } = req.body;

    if (!unitName?.trim()) {
      return res.status(400).json({ message: 'Vui lòng chọn đơn vị / tổ đội phụ trách.' });
    }

    if (expectedUpdatedAt && doc.updatedAtIso !== expectedUpdatedAt) {
      return res.status(409).json({
        message: 'Hồ sơ vừa được cán bộ khác cập nhật. Vui lòng tải lại để kiểm tra.',
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const days = Math.max(1, Number(deadlineDays) || 2);
    const deadlineIso = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    if (doc.assignedTo) {
      doc.assignmentHistory = doc.assignmentHistory || [];
      doc.assignmentHistory.push({
        changedAt: nowIso,
        changedBy: officerName,
        reason: reason?.trim() || 'Điều chỉnh phân công xử lý',
        before: {
          unitName: doc.assignedTo.unitName,
          assigneeName: doc.assignedTo.assigneeName,
          deadline: doc.assignedTo.deadline,
          notes: doc.assignedTo.notes,
          category: doc.category,
          priority: doc.priority,
        },
        after: {
          unitName: unitName.trim(),
          assigneeName: assigneeName?.trim() || undefined,
          deadline: deadlineIso,
          notes: notes?.trim() || undefined,
          category: category || doc.category,
          priority: priority || doc.priority,
        },
      });
    }

    if (priority) doc.priority = priority;
    if (category) doc.category = category;
    doc.status = 'assigned';
    doc.assignedTo = {
      unitName: unitName.trim(),
      officerName,
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName?.trim() || undefined,
      assignedAt: nowIso,
      deadline: deadlineIso,
      notes: notes?.trim() || undefined,
    };
    if (Array.isArray(workflowSteps) && workflowSteps.length > 0) {
      doc.workflowSteps = workflowSteps
        .filter((s: any) => s && typeof s.title === 'string' && s.title.trim())
        .map((s: any, idx: number) => ({
          id: s.id || `step-${idx + 1}`,
          title: s.title.trim(),
          completed: !!s.completed,
          completedAt: s.completedAt,
          completedBy: s.completedBy,
        }));
    }
    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] assign error:', err);
    return res.status(500).json({ message: 'Không thể phân công hồ sơ.' });
  }
}

// POST /api/incidents/:id/verify (MOD-05: Xác minh thực địa)
export async function verifyIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });

    const { notes } = req.body;
    doc.verifiedByVolunteer = true;
    doc.verificationNotes = notes?.trim() || 'Đã kiểm tra và xác nhận sự cố thực tế tại hiện trường.';
    doc.updatedAtIso = new Date().toISOString();
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] verify error:', err);
    return res.status(500).json({ message: 'Không thể xác minh hiện trường.' });
  }
}

// POST /api/incidents/:id/start (MOD-05: Nhận việc / Bắt đầu xử lý)
export async function startIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status !== 'assigned') {
      return res.status(400).json({ message: 'Chỉ có thể bắt đầu xử lý hồ sơ ở trạng thái Đã giao.' });
    }

    doc.status = 'in_progress';
    doc.updatedAtIso = new Date().toISOString();
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] start error:', err);
    return res.status(500).json({ message: 'Không thể bắt đầu xử lý hồ sơ.' });
  }
}

// POST /api/incidents/:id/resolve (MOD-05: Nghiệm thu sau xử lý + ảnh Cloudinary)
export async function resolveIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status === 'pending') {
      return res.status(400).json({ message: 'Hồ sơ chưa được phân công, không thể nghiệm thu.' });
    }

    const { notes, photosAfter, officerName = 'Nguyễn Thành Long' } = req.body;
    if (!notes?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập ghi chú kết quả xử lý nghiệm thu.' });
    }

    const nowIso = new Date().toISOString();
    doc.status = 'resolved';
    doc.photosAfter = Array.isArray(photosAfter) ? photosAfter : [];
    doc.resolution = {
      notes: notes.trim(),
      resolvedAt: nowIso,
      officerName,
    };
    if (doc.workflowSteps && doc.workflowSteps.length > 0) {
      doc.workflowSteps = doc.workflowSteps.map((s) =>
        s.completed
          ? s
          : {
              ...s,
              completed: true,
              completedAt: nowIso,
              completedBy: officerName,
            }
      );
    }
    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] resolve error:', err);
    return res.status(500).json({ message: 'Không thể nghiệm thu hoàn tất hồ sơ.' });
  }
}

// PATCH /api/incidents/:id/workflow/:stepId — Tick hoàn thành / bỏ tick 1 bước quy trình hiện trường
export async function toggleWorkflowStep(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (!doc.workflowSteps || doc.workflowSteps.length === 0) {
      return res.status(400).json({ message: 'Hồ sơ này chưa có quy trình xử lý.' });
    }

    const stepId = req.params.stepId;
    const actorName = req.body?.actorName || 'Đội hiện trường';
    const nowIso = new Date().toISOString();

    let found = false;
    doc.workflowSteps = doc.workflowSteps.map((s) => {
      if (s.id !== stepId) return s;
      found = true;
      const nextDone = !s.completed;
      return {
        id: s.id,
        title: s.title,
        completed: nextDone,
        completedAt: nextDone ? nowIso : undefined,
        completedBy: nextDone ? actorName : undefined,
      };
    });

    if (!found) {
      return res.status(404).json({ message: 'Không tìm thấy bước quy trình.' });
    }

    doc.updatedAtIso = nowIso;
    await doc.save();
    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] toggleWorkflowStep error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật bước quy trình.' });
  }
}

import type { Request, Response } from 'express';
import { IncidentModel, serializeIncident } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';
import { analyzeDuplicatesWithAI, distanceMeters } from '../services/aiDuplicateService';
import { deleteCloudinaryUrls } from '../config/cloudinary';
import type { AuthRequest } from '../middlewares/auth';
import {
  checkIpRateLimit,
  getClientIp,
  recordIpSubmission,
  validateIncidentContent,
} from '../utils/antiSpam';

function normalizePhone(phone?: string): string {
  return String(phone || '').replace(/\D/g, '').trim();
}

function canMutateIncident(req: AuthRequest, docSenderPhone?: string): boolean {
  if (req.user && req.user.role !== 'citizen') {
    return true;
  }
  const ownerPhone = normalizePhone(docSenderPhone);
  if (!ownerPhone) return false;
  const authPhone = normalizePhone(req.user?.phone);
  if (authPhone && authPhone === ownerPhone) return true;

  const headerPhone = normalizePhone(
    (req.headers['x-requester-phone'] as string | undefined) ||
      (req.body?.requesterPhone as string | undefined) ||
      (req.query?.requesterPhone as string | undefined)
  );
  return Boolean(headerPhone && headerPhone === ownerPhone);
}

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
      filter.status = { $nin: ['resolved', 'closed', 'rejected', 'pending_review'] };
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

    const docs = await IncidentModel.find(filter).sort({ createdAtIso: -1 }).lean();
    return res.json({
      incidents: docs.map((d) => serializeIncident(d as any)),
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

// POST /api/incidents (MOD-01: Công dân tạo phản ánh mới — có chống spam theo IP 2 phút & lọc rác)
export async function createIncident(req: AuthRequest, res: Response) {
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

    const isStaffUser = Boolean(req.user && req.user.role !== 'citizen');
    const clientIp = getClientIp(req);

    if (!isStaffUser) {
      const cleanupRejectedPhotos = () => {
        if (Array.isArray(photosBefore) && photosBefore.length > 0) {
          void deleteCloudinaryUrls(photosBefore);
        }
      };

      // 1. Giới hạn tần suất gửi theo IP: 2 phút / lần
      const ipCheck = checkIpRateLimit(clientIp);
      if (!ipCheck.ok) {
        cleanupRejectedPhotos();
        return res.status(429).json({
          message: ipCheck.message,
          retryAfterSec: ipCheck.retryAfterSec,
        });
      }

      // 2. Bộ lọc nội dung rác / spam / từ khóa quảng cáo
      const contentCheck = validateIncidentContent(description, title);
      if (!contentCheck.ok) {
        cleanupRejectedPhotos();
        return res.status(400).json({ message: contentCheck.message });
      }

      // 3. Chống gửi quá nhiều bài Chờ duyệt hoặc gửi đúp y hệt từ cùng 1 SĐT
      const cleanPhone = normalizePhone(senderPhone);
      if (cleanPhone.length >= 9) {
        const myPendingDocs = await IncidentModel.find(
          { status: 'pending_review', 'sender.phone': { $regex: cleanPhone.slice(-9) } },
          { description: 1, createdAtIso: 1 }
        ).lean();

        if (myPendingDocs.length >= 3) {
          cleanupRejectedPhotos();
          return res.status(429).json({
            message:
              'Bạn hiện có 3 phản ánh đang chờ UBND Phường duyệt. Vui lòng đợi duyệt xong trước khi gửi thêm.',
          });
        }

        const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
        const normalizedNewDesc = description.trim().toLowerCase();
        const isExactDup = myPendingDocs.some(
          (d) =>
            Date.parse(String(d.createdAtIso || '')) >= fifteenMinsAgo &&
            String(d.description || '').trim().toLowerCase() === normalizedNewDesc
        );
        if (isExactDup) {
          cleanupRejectedPhotos();
          return res.status(409).json({
            message: 'Bạn vừa gửi phản ánh có nội dung tương tự trong 15 phút qua. Không cần gửi lặp lại.',
          });
        }
      }
    }

    const nowIso = new Date().toISOString();
    // Tính số lớn nhất hiện có để tránh lỗi E11000 duplicate code khi từng có hồ sơ bị xóa/gộp
    const existingCodes = await IncidentModel.find({}, { code: 1 }).lean();
    let maxNum = 0;
    for (const item of existingCodes) {
      const m = String(item.code || '').match(/(\d+)$/);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
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
      status: 'pending_review',
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

    if (!isStaffUser) {
      recordIpSubmission(clientIp);
    }

    return res.status(201).json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] create error:', err);
    return res.status(500).json({ message: 'Không thể tạo phản ánh mới.' });
  }
}

// PATCH /api/incidents/:id (MOD-01: Công dân chỉnh sửa hồ sơ chính chủ khi đang Chờ duyệt)
export async function updateIncident(req: AuthRequest, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ phản ánh.' });
    }
    if (!canMutateIncident(req, doc.sender?.phone)) {
      return res.status(403).json({
        message: 'Bạn không có quyền chỉnh sửa phản ánh của người khác.',
      });
    }
    if (doc.status !== 'pending_review') {
      return res.status(400).json({ message: 'Hồ sơ đã được duyệt tiếp nhận hoặc xử lý, không thể chỉnh sửa.' });
    }

    const { title, description, category, location, photosBefore } = req.body;
    const oldPhotos = Array.isArray(doc.photosBefore) ? [...doc.photosBefore] : [];

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

    // Dọn ảnh đã bị người dùng gỡ khỏi hồ sơ trên Cloudinary
    if (Array.isArray(photosBefore)) {
      const removedUrls = oldPhotos.filter((u) => !photosBefore.includes(u));
      if (removedUrls.length > 0) {
        void deleteCloudinaryUrls(removedUrls);
      }
    }

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] update error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật hồ sơ phản ánh.' });
  }
}

// DELETE /api/incidents/:id (MOD-01: Công dân hủy phản ánh chính chủ khi đang Chờ duyệt)
export async function deleteIncident(req: AuthRequest, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ phản ánh.' });
    }
    if (!canMutateIncident(req, doc.sender?.phone)) {
      return res.status(403).json({
        message: 'Bạn không có quyền hủy phản ánh của người khác.',
      });
    }
    if (doc.status !== 'pending_review') {
      return res.status(400).json({ message: 'Hồ sơ đã được duyệt tiếp nhận hoặc xử lý, không thể hủy.' });
    }

    const urlsToClean = [
      ...(Array.isArray(doc.photosBefore) ? doc.photosBefore : []),
      ...(Array.isArray(doc.photosAfter) ? doc.photosAfter : []),
    ];

    await IncidentModel.deleteOne({ _id: doc._id });

    // Tự động dọn toàn bộ ảnh của hồ sơ đã hủy trên Cloudinary
    if (urlsToClean.length > 0) {
      void deleteCloudinaryUrls(urlsToClean);
    }

    return res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[Incidents] delete error:', err);
    return res.status(500).json({ message: 'Không thể hủy phản ánh.' });
  }
}

const upvoteTracker = new Set<string>();

// POST /api/incidents/:id/upvote (MOD-02: Đồng phản ánh — mỗi người/IP tối đa 1 lượt/hồ sơ)
export async function upvoteIncident(req: AuthRequest, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });

    const actorKey = `${req.params.id}:${req.user?.userId || getClientIp(req)}`;
    if (upvoteTracker.has(actorKey)) {
      return res.json({ incident: serializeIncident(doc), alreadyUpvoted: true });
    }
    if (upvoteTracker.size > 5000) upvoteTracker.clear();
    upvoteTracker.add(actorKey);

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

// POST /api/incidents/:id/approve — Cán bộ duyệt tiếp nhận phản ánh (pending_review -> pending)
export async function approveIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status !== 'pending_review') {
      return res.status(400).json({ message: 'Hồ sơ này không ở trạng thái Chờ duyệt.' });
    }

    const nowIso = new Date().toISOString();
    doc.status = 'pending';
    doc.review = {
      decision: 'approved',
      reviewedAt: nowIso,
      reviewedBy: req.body?.officerName || 'Nguyễn Thành Long',
    };
    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] approve error:', err);
    return res.status(500).json({ message: 'Không thể duyệt tiếp nhận hồ sơ.' });
  }
}

// POST /api/incidents/:id/reject — Cán bộ từ chối tiếp nhận phản ánh (pending_review -> rejected)
export async function rejectIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (doc.status !== 'pending_review') {
      return res.status(400).json({ message: 'Hồ sơ này không ở trạng thái Chờ duyệt.' });
    }

    const reason = req.body?.reason?.trim();
    if (!reason) {
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối tiếp nhận.' });
    }

    const nowIso = new Date().toISOString();
    doc.status = 'rejected';
    doc.review = {
      decision: 'rejected',
      reviewedAt: nowIso,
      reviewedBy: req.body?.officerName || 'Nguyễn Thành Long',
      reason,
    };
    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] reject error:', err);
    return res.status(500).json({ message: 'Không thể từ chối hồ sơ.' });
  }
}

// POST /api/incidents/:id/assign (MOD-04: Phân công Cá nhân / Tổ đội & Điều chỉnh phân công)
export async function assignIncident(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (!['pending', 'assigned', 'in_progress'].includes(doc.status)) {
      return res.status(400).json({
        message: 'Chỉ có thể phân công hồ sơ ở trạng thái Chờ phân công, Đã giao hoặc Đang xử lý.',
      });
    }

    const {
      unitName,
      deadline,
      deadlineHours,
      deadlineDays = 1,
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
    let deadlineIso: string;
    if (deadline && Number.isFinite(Date.parse(String(deadline))) && Date.parse(String(deadline)) > now.getTime()) {
      deadlineIso = new Date(Date.parse(String(deadline))).toISOString();
    } else if (deadlineHours !== undefined && Number(deadlineHours) > 0) {
      const hrs = Math.min(720, Math.max(1, Number(deadlineHours)));
      deadlineIso = new Date(now.getTime() + hrs * 60 * 60 * 1000).toISOString();
    } else {
      const days = Math.max(1 / 24, Number(deadlineDays) || 1);
      deadlineIso = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    }

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
    if (doc.status === 'pending') {
      doc.status = 'assigned';
    }
    doc.assignedTo = {
      unitName: unitName.trim(),
      officerName,
      assigneeId: assigneeId || undefined,
      assigneeName: assigneeName?.trim() || undefined,
      assignedAt: doc.assignedTo?.assignedAt || nowIso,
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
    if (doc.status !== 'assigned' && doc.status !== 'in_progress') {
      return res.status(400).json({
        message: 'Chỉ có thể nghiệm thu hồ sơ đang ở trạng thái Đã giao hoặc Đang xử lý.',
      });
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

// PATCH /api/incidents/:id/workflow/:stepId — Tick hoàn thành / bỏ tick 1 bước quy trình hiện trường (atomic update tránh VersionError khi tick nhanh)
export async function toggleWorkflowStep(req: Request, res: Response) {
  try {
    const stepId = req.params.stepId;
    const actorName = req.body?.actorName || 'Đội hiện trường';
    const nowIso = new Date().toISOString();

    const current = await IncidentModel.findOne(
      { incidentId: req.params.id },
      { workflowSteps: 1 }
    ).lean();
    if (!current) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
    if (!current.workflowSteps || current.workflowSteps.length === 0) {
      return res.status(400).json({ message: 'Hồ sơ này chưa có quy trình xử lý.' });
    }

    const targetStep = current.workflowSteps.find((s) => s.id === stepId);
    if (!targetStep) {
      return res.status(404).json({ message: 'Không tìm thấy bước quy trình.' });
    }

    const nextDone =
      typeof req.body?.completed === 'boolean' ? req.body.completed : !targetStep.completed;

    const updated = await IncidentModel.findOneAndUpdate(
      { incidentId: req.params.id, 'workflowSteps.id': stepId },
      {
        $set: {
          'workflowSteps.$.completed': nextDone,
          'workflowSteps.$.completedAt': nextDone ? nowIso : undefined,
          'workflowSteps.$.completedBy': nextDone ? actorName : undefined,
          updatedAtIso: nowIso,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy bước quy trình.' });
    }

    return res.json({ incident: serializeIncident(updated) });
  } catch (err) {
    console.error('[Incidents] toggleWorkflowStep error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật bước quy trình.' });
  }
}

// POST /api/incidents/check-duplicate — Quét bán kính 50m + AI Gemini 2.5 Flash phân tích chéo loại
export async function checkDuplicates(req: Request, res: Response) {
  try {
    const {
      title = '',
      description = '',
      category = 'other',
      lat,
      lng,
      radiusMeters = 50,
      excludeId,
    } = req.body as {
      title?: string;
      description?: string;
      category?: IncidentCategoryType;
      lat?: number;
      lng?: number;
      radiusMeters?: number;
      excludeId?: string;
    };

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
      return res.status(400).json({ message: 'Tọa độ không hợp lệ.' });
    }

    const radius = Math.min(200, Math.max(10, Number(radiusMeters) || 50));

    // Lấy toàn bộ hồ sơ đang mở (không phân biệt loại)
    const openDocs = await IncidentModel.find({
      status: { $in: ['pending_review', 'pending', 'assigned', 'in_progress'] },
      ...(excludeId ? { incidentId: { $ne: excludeId } } : {}),
    });

    const nearby = openDocs
      .map((doc) => ({
        doc,
        distance: distanceMeters(numLat, numLng, doc.location.lat, doc.location.lng),
      }))
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);

    if (nearby.length === 0) {
      return res.json({
        candidates: [],
        suggestedCategory: undefined,
        analyzedBy: 'ngram',
      });
    }

    const analysis = await analyzeDuplicatesWithAI(
      { title, description, category, lat: numLat, lng: numLng },
      nearby
    );

    const docMap = new Map(nearby.map((n) => [n.doc.incidentId, n.doc]));
    const candidates = analysis.matches
      .map((m) => {
        const doc = docMap.get(m.incidentId);
        if (!doc) return null;
        return {
          incident: serializeIncident(doc),
          distanceMeters: m.distanceMeters,
          isDuplicate: m.isDuplicate,
          confidence: m.confidence,
          reason: m.reason,
        };
      })
      .filter(Boolean);

    return res.json({
      candidates,
      suggestedCategory: analysis.suggestedCategory,
      analyzedBy: analysis.analyzedBy,
    });
  } catch (err) {
    console.error('[Incidents] checkDuplicates error:', err);
    return res.status(500).json({ message: 'Không thể kiểm tra phản ánh tương tự.' });
  }
}

// POST /api/incidents/:id/link-duplicate — Công dân chọn "Đúng là sự cố này (+1 đồng phản ánh)"
export async function linkDuplicate(req: Request, res: Response) {
  try {
    const doc = await IncidentModel.findOne({ incidentId: req.params.id });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy hồ sơ gốc.' });

    const { senderName, senderPhone, photos } = req.body as {
      senderName?: string;
      senderPhone?: string;
      photos?: string[];
    };

    const nowIso = new Date().toISOString();
    doc.linkedReports = doc.linkedReports || [];
    doc.linkedReports.push({
      sender: {
        name: senderName?.trim() || 'Công dân Phường Trấn Biên',
        phone: senderPhone?.trim() || '0900000000',
      },
      photos: Array.isArray(photos) ? photos : [],
      reportedAt: nowIso,
    });
    doc.sameReportsCount = (doc.sameReportsCount || 1) + 1;

    // Tự động nâng mức ưu tiên khi có >= 3 người cùng phản ánh
    if (doc.sameReportsCount >= 3 && doc.priority === 'normal') {
      doc.priority = 'high';
    }

    doc.updatedAtIso = nowIso;
    await doc.save();

    return res.json({ incident: serializeIncident(doc) });
  } catch (err) {
    console.error('[Incidents] linkDuplicate error:', err);
    return res.status(500).json({ message: 'Không thể gộp đồng phản ánh.' });
  }
}

// POST /api/incidents/:targetId/merge/:sourceId — Cán bộ gộp hồ sơ trùng (hỗ trợ gộp chéo loại)
export async function mergeIncidents(req: Request, res: Response) {
  try {
    const { targetId, sourceId } = req.params;
    if (targetId === sourceId) {
      return res.status(400).json({ message: 'Không thể tự gộp một hồ sơ vào chính nó.' });
    }

    const [target, source] = await Promise.all([
      IncidentModel.findOne({ incidentId: targetId }),
      IncidentModel.findOne({ incidentId: sourceId }),
    ]);

    if (!target || !source) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ cần gộp.' });
    }

    const nowIso = new Date().toISOString();
    target.linkedReports = target.linkedReports || [];
    target.linkedReports.push({
      sender: source.sender,
      photos: source.photosBefore || [],
      reportedAt: source.createdAtIso,
    });
    if (source.linkedReports && source.linkedReports.length > 0) {
      target.linkedReports.push(...source.linkedReports);
    }

    target.sameReportsCount = (target.sameReportsCount || 1) + (source.sameReportsCount || 1);
    if (target.sameReportsCount >= 3 && target.priority === 'normal') {
      target.priority = 'high';
    }

    const { newCategory } = req.body as { newCategory?: IncidentCategoryType };
    if (newCategory) {
      target.category = newCategory;
    }

    target.updatedAtIso = nowIso;
    await target.save();
    await IncidentModel.deleteOne({ _id: source._id });

    return res.json({
      incident: serializeIncident(target),
      mergedSourceId: sourceId,
    });
  } catch (err) {
    console.error('[Incidents] mergeIncidents error:', err);
    return res.status(500).json({ message: 'Không thể gộp 2 hồ sơ lúc này.' });
  }
}

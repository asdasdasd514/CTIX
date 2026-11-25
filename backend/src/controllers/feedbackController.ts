import type { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth';
import { FeedbackModel, serializeFeedback } from '../models/Feedback';

// POST /api/feedbacks — Công dân gửi góp ý (khách hoặc đã đăng nhập đều gửi được)
export async function createFeedback(req: AuthRequest, res: Response) {
  try {
    const rawContent = String(req.body?.content || '').trim();
    if (rawContent.length < 3) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung góp ý (tối thiểu 3 ký tự).' });
    }
    if (rawContent.length > 2000) {
      return res.status(400).json({ message: 'Nội dung góp ý tối đa 2000 ký tự.' });
    }

    const senderName =
      String(req.body?.senderName || '').trim() ||
      req.user?.name ||
      'Công dân Phường Trấn Biên';
    const senderPhone =
      String(req.body?.senderPhone || '').trim() ||
      req.user?.phone ||
      '';

    const doc = await FeedbackModel.create({
      feedbackId: `fb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      senderName,
      senderPhone,
      content: rawContent,
      isRead: false,
    });

    return res.status(201).json({ feedback: serializeFeedback(doc) });
  } catch (err) {
    console.error('[Feedbacks] create error:', err);
    return res.status(500).json({ message: 'Không thể gửi góp ý lúc này.' });
  }
}

// GET /api/feedbacks — Admin xem toàn bộ danh sách góp ý mới nhất lên đầu
export async function listFeedbacks(_req: AuthRequest, res: Response) {
  try {
    const docs = await FeedbackModel.find().sort({ createdAt: -1 });
    return res.json({
      feedbacks: docs.map(serializeFeedback),
      total: docs.length,
    });
  } catch (err) {
    console.error('[Feedbacks] list error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách góp ý.' });
  }
}

// PATCH /api/feedbacks/:id/read — Đánh dấu Đã đọc / Chưa đọc
export async function toggleFeedbackRead(req: AuthRequest, res: Response) {
  try {
    const doc = await FeedbackModel.findOne({ feedbackId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy góp ý.' });
    }
    doc.isRead =
      typeof req.body?.isRead === 'boolean' ? req.body.isRead : !doc.isRead;
    await doc.save();
    return res.json({ feedback: serializeFeedback(doc) });
  } catch (err) {
    console.error('[Feedbacks] toggleRead error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật trạng thái góp ý.' });
  }
}

// DELETE /api/feedbacks/:id — Admin xóa góp ý
export async function deleteFeedback(req: AuthRequest, res: Response) {
  try {
    const doc = await FeedbackModel.findOne({ feedbackId: req.params.id });
    if (!doc) {
      return res.status(404).json({ message: 'Không tìm thấy góp ý.' });
    }
    await FeedbackModel.deleteOne({ _id: doc._id });
    return res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[Feedbacks] delete error:', err);
    return res.status(500).json({ message: 'Không thể xóa góp ý.' });
  }
}

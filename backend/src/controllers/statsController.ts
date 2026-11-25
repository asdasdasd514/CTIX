import type { Request, Response } from 'express';
import { IncidentModel } from '../models/Incident';

export async function getSummaryStats(_req: Request, res: Response) {
  try {
    const allDocs = await IncidentModel.find();
    const rejected = allDocs.filter((d) => d.status === 'rejected').length;
    const pendingReview = allDocs.filter((d) => d.status === 'pending_review').length;
    const docs = allDocs.filter((d) => d.status !== 'rejected');
    const total = docs.length;
    const pending = docs.filter((d) => d.status === 'pending').length;
    const active = docs.filter((d) => d.status === 'assigned' || d.status === 'in_progress').length;
    const completed = docs.filter((d) => d.status === 'resolved' || d.status === 'closed').length;

    const durationsDays: number[] = [];
    let ratingSum = 0;
    let ratingCount = 0;

    for (const d of docs) {
      if ((d.status === 'resolved' || d.status === 'closed') && d.resolution?.resolvedAt) {
        const diff =
          (new Date(d.resolution.resolvedAt).getTime() - new Date(d.createdAtIso).getTime()) /
          (1000 * 60 * 60 * 24);
        if (diff >= 0 && Number.isFinite(diff)) durationsDays.push(diff);
      }
      if (d.rating?.stars) {
        ratingSum += d.rating.stars;
        ratingCount++;
      }
    }

    const averageDays =
      durationsDays.length > 0
        ? Number((durationsDays.reduce((a, b) => a + b, 0) / durationsDays.length).toFixed(1))
        : 0;
    const averageRating =
      ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 0;

    return res.json({
      total,
      pendingReview,
      pending,
      active,
      completed,
      rejected,
      averageDays,
      averageRating,
      ratingCount,
    });
  } catch (err) {
    console.error('[Stats] getSummaryStats error:', err);
    return res.status(500).json({ message: 'Không thể tổng hợp thống kê.' });
  }
}

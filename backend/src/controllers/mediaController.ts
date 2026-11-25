import type { Request, Response } from 'express';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

const VALID_PHASES = new Set(['before', 'after', 'linked']);
const VALID_CATEGORIES = new Set([
  'street_light',
  'flooding',
  'waste',
  'road_damage',
  'other',
]);

export async function uploadMedia(req: Request, res: Response) {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 ảnh để tải lên.' });
    }

    const rawPhase = String(req.body?.phase || 'before').trim();
    const phase = VALID_PHASES.has(rawPhase) ? rawPhase : 'before';

    const rawCategory = String(req.body?.category || 'other').trim();
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'other';

    const folder =
      phase === 'linked'
        ? `ctix_smartcity/incidents/linked/${category}`
        : `ctix_smartcity/incidents/${phase}/${category}`;

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const res = await uploadBufferToCloudinary(file.buffer, folder);
        const hasBakedWatermark = /_wm([._-]|$)/i.test(file.originalname || '');
        const finalUrl =
          hasBakedWatermark && !/[?&]wm=1\b/i.test(res.url)
            ? `${res.url}${res.url.includes('?') ? '&' : '?'}wm=1`
            : res.url;
        return { ...res, url: finalUrl };
      })
    );

    return res.status(201).json({
      folder,
      images: uploaded,
      urls: uploaded.map((item) => item.url),
    });
  } catch (err) {
    console.error('[Media] upload error:', err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Tải ảnh lên Cloudinary thất bại.',
    });
  }
}

export async function deleteMedia(req: Request, res: Response) {
  try {
    const { publicId } = req.body as { publicId?: string };
    if (!publicId) {
      return res.status(400).json({ message: 'Thiếu publicId của ảnh cần xóa.' });
    }
    await deleteFromCloudinary(publicId);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[Media] delete error:', err);
    return res.status(500).json({ message: 'Không thể xóa ảnh trên Cloudinary.' });
  }
}

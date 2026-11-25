import type { Request, Response } from 'express';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export async function uploadMedia(req: Request, res: Response) {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 ảnh để tải lên.' });
    }

    const folder =
      req.body?.phase === 'after'
        ? 'ctix_smartcity/incidents/after'
        : 'ctix_smartcity/incidents/before';

    const uploaded = await Promise.all(
      files.map((file) => uploadBufferToCloudinary(file.buffer, folder))
    );

    return res.status(201).json({
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

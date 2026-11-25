import multer from 'multer';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB / ảnh
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc GIF.'));
    }
    cb(null, true);
  },
});

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024, // 6MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('audio/') && file.mimetype !== 'application/octet-stream') {
      return cb(new Error('Định dạng tệp âm thanh không hợp lệ.'));
    }
    cb(null, true);
  },
});

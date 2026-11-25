/**
 * Nén và resize ảnh thông minh ngay trên trình duyệt bằng Canvas trước khi upload Cloudinary.
 * Giúp ảnh chụp điện thoại (4-10MB) giảm xuống còn ~150-300KB mà vẫn sắc nét,
 * tránh lỗi vượt giới hạn tải lên và không bao giờ làm đầy bộ nhớ trình duyệt.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // Nếu ảnh đã nhỏ (< 280KB) thì giữ nguyên để khỏi giảm chất lượng
  if (file.size <= 280 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'hien-truong';
            resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageFile(f)));
}

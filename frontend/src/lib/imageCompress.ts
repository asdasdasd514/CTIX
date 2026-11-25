/**
 * Nén, resize và đóng dấu thời gian + địa chỉ kiểu Timestamp Camera lên ảnh ngay trên trình duyệt.
 * - Ảnh chụp điện thoại (4-10MB) giảm xuống còn ~150-350KB mà vẫn sắc nét.
 * - Watermark góc dưới trái đúng chuẩn Timestamp Camera:
 *     08:14 | 23 Tháng 11, 2026
 *           | Thứ Hai
 *     128 Nguyễn Ái Quốc, Khu phố 2, Phường Trấn Biên
 */

const VI_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export interface WatermarkOptions {
  timestamp?: Date;
  address?: string;
}

export async function compressImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

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
            resolve(new File([blob], `${baseName}_wm.jpg`, { type: 'image/jpeg' }));
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

/**
 * Đóng dấu Thời gian (HH:mm | DD Tháng MM, YYYY / Thứ ...) & Địa chỉ trực tiếp lên ảnh bằng Canvas.
 */
export async function stampTimestampWatermark(
  file: File,
  options: WatermarkOptions = {},
  maxDimension = 1400,
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  const now = options.timestamp || new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeText = `${hh}:${mm}`;
  const dateText = `${now.getDate()} Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
  const weekdayText = VI_WEEKDAYS[now.getDay()] || '';
  const addressText = (options.address || 'Phường Trấn Biên, TP. Biên Hòa, Đồng Nai').trim();

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

        // Tỷ lệ font co giãn hài hòa theo kích thước ảnh (cả ảnh dọc & ảnh ngang)
        const base = Math.max(420, Math.min(width, height));
        const padX = Math.round(width * 0.032);
        const padBottom = Math.round(height * 0.03);
        const timeFontSize = Math.round(base * 0.095);
        const metaFontSize = Math.round(base * 0.034);
        const addrFontSize = Math.round(base * 0.031);
        const addrLineHeight = Math.round(addrFontSize * 1.32);

        // Chia dòng địa chỉ nếu dài quá 90% chiều rộng ảnh
        ctx.font = `600 ${addrFontSize}px "Segoe UI", Roboto, Arial, sans-serif`;
        const maxAddrWidth = width - padX * 2;
        const addrWords = addressText.split(' ');
        const addrLines: string[] = [];
        let currentLine = '';
        for (const word of addrWords) {
          const test = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(test).width > maxAddrWidth && currentLine) {
            addrLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = test;
          }
        }
        if (currentLine) addrLines.push(currentLine);
        const finalAddrLines = addrLines.slice(0, 2);

        // Lớp chuyển tối nhẹ phía dưới để chữ trắng luôn cực kỳ sắc nét trên mọi nền sáng/tối
        const blockHeight = timeFontSize + finalAddrLines.length * addrLineHeight + padBottom * 2.2;
        const grad = ctx.createLinearGradient(0, height - blockHeight - 24, 0, height);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.34)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - blockHeight - 24, width, blockHeight + 24);

        const drawOutlinedText = (text: string, x: number, y: number, strokeW: number) => {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1.5;
          ctx.lineWidth = strokeW;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.lineJoin = 'round';
          ctx.strokeText(text, x, y);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, y);
          ctx.restore();
        };

        // Vẽ dòng địa chỉ ở đáy
        ctx.font = `600 ${addrFontSize}px "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.textBaseline = 'bottom';
        let cursorY = height - padBottom;
        for (let i = finalAddrLines.length - 1; i >= 0; i--) {
          drawOutlinedText(finalAddrLines[i], padX, cursorY, Math.max(2, addrFontSize * 0.1));
          cursorY -= addrLineHeight;
        }

        const timeBottomY = cursorY - Math.round(base * 0.012);

        // Vẽ Giờ lớn (HH:mm)
        ctx.font = `700 ${timeFontSize}px "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.textBaseline = 'bottom';
        drawOutlinedText(timeText, padX, timeBottomY, Math.max(2.5, timeFontSize * 0.065));
        const timeWidth = ctx.measureText(timeText).width;

        // Vẽ vạch chia dọc cạnh giờ
        const dividerX = padX + timeWidth + Math.round(base * 0.022);
        const dividerTop = timeBottomY - Math.round(timeFontSize * 0.84);
        const dividerHeight = Math.round(timeFontSize * 0.76);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillRect(dividerX, dividerTop, Math.max(2.5, Math.round(base * 0.0055)), dividerHeight);
        ctx.restore();

        // Vẽ Ngày tháng & Thứ bên phải vạch chia
        const metaX = dividerX + Math.round(base * 0.024);
        ctx.font = `600 ${metaFontSize}px "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.textBaseline = 'top';
        drawOutlinedText(dateText, metaX, dividerTop, Math.max(2, metaFontSize * 0.1));

        ctx.textBaseline = 'bottom';
        drawOutlinedText(weekdayText, metaX, dividerTop + dividerHeight, Math.max(2, metaFontSize * 0.1));

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'hien-truong';
            resolve(new File([blob], `${baseName}_wm.jpg`, { type: 'image/jpeg' }));
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

export async function stampTimestampWatermarks(
  files: File[],
  options: WatermarkOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((f) => stampTimestampWatermark(f, options)));
}

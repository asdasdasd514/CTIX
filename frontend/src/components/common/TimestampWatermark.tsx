import React from 'react';

const VI_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

/**
 * Kiểm tra ảnh đã được đóng dấu cứng (Canvas) lúc upload hay chưa
 * để tránh hiển thị đè 2 lớp watermark.
 */
export function isRightWatermarkedUrl(url?: string): boolean {
  if (!url) return false;
  return /[?&]wm=r\b/i.test(url) || /_wmr([._-]|$)/i.test(url);
}

export function isAlreadyWatermarkedUrl(url?: string, align: 'left' | 'right' = 'left'): boolean {
  if (!url) return false;
  if (align === 'right') {
    // Ảnh SAU XỬ LÝ chỉ ẩn lớp overlay phải khi ảnh đã đóng dấu cứng ở góc PHẢI (?wm=r / _wmr)
    return isRightWatermarkedUrl(url);
  }
  return /[?&]wm=(1|r)\b/i.test(url) || /_wmr?([._-]|$)/i.test(url);
}

interface TimestampWatermarkProps {
  timestamp?: string | Date;
  address?: string;
  imageUrl?: string;
  compact?: boolean;
  align?: 'left' | 'right';
  visible?: boolean;
}

export const TimestampWatermark: React.FC<TimestampWatermarkProps> = ({
  timestamp,
  address,
  imageUrl,
  compact = false,
  align = 'left',
  visible = true,
}) => {
  if (!timestamp || isAlreadyWatermarkedUrl(imageUrl, align)) return null;
  const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(dateObj.getTime())) return null;

  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  const timeText = `${hh}:${mm}`;
  const dateText = `${dateObj.getDate()} Tháng ${dateObj.getMonth() + 1}, ${dateObj.getFullYear()}`;
  const weekdayText = VI_WEEKDAYS[dateObj.getDay()] || '';
  const addrText = (address || 'Phường Trấn Biên, TP. Biên Hòa, Đồng Nai').trim();
  const isRight = align === 'right';

  return (
    <div
      className={`pointer-events-none select-none absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 pb-3 sm:pb-4 pt-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        fontFamily: '"Segoe UI", Roboto, Arial, sans-serif',
        textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
      }}
    >
      <div className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'}`}>
        <div className="flex items-center gap-2 sm:gap-2.5 text-left">
          <span
            className={`font-bold leading-none tracking-tight ${
              compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[32px]'
            }`}
          >
            {timeText}
          </span>
          <span className="w-[2px] self-stretch bg-white/85 rounded-full my-0.5 shrink-0" />
          <div className="leading-tight min-w-0">
            <div className={`font-semibold ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'}`}>
              {dateText}
            </div>
            <div className={`font-semibold text-white/95 ${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[13px]'}`}>
              {weekdayText}
            </div>
          </div>
        </div>
        <div
          className={`font-semibold text-white/95 mt-1 line-clamp-1 max-w-[90%] ${
            compact ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'
          }`}
        >
          {addrText}
        </div>
      </div>
    </div>
  );
};

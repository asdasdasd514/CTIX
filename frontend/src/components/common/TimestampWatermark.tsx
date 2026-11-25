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
export function isAlreadyWatermarkedUrl(url?: string): boolean {
  if (!url) return false;
  return /[?&]wm=1\b/i.test(url) || /_wm([._-]|$)/i.test(url);
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
  if (!timestamp || isAlreadyWatermarkedUrl(imageUrl)) return null;
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
      className={`pointer-events-none select-none absolute inset-x-0 bottom-0 z-10 px-2.5 sm:px-3.5 pb-2 sm:pb-3 pt-8 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)' }}
    >
      <div className={`flex flex-col ${isRight ? 'items-end text-right' : 'items-start text-left'}`}>
        <div className={`flex items-center gap-2 sm:gap-2.5 ${isRight ? 'flex-row-reverse' : ''}`}>
          <span
            className={`font-extrabold leading-none tracking-tight ${
              compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {timeText}
          </span>
          <span className="w-[2px] self-stretch bg-white/85 rounded-full my-0.5 shrink-0" />
          <div className="leading-tight min-w-0">
            <div className={`font-bold ${compact ? 'text-[10px] sm:text-[11px]' : 'text-[11px] sm:text-xs'}`}>
              {dateText}
            </div>
            <div className={`font-semibold text-white/95 ${compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>
              {weekdayText}
            </div>
          </div>
        </div>
        <div
          className={`font-semibold text-white/95 mt-0.5 line-clamp-1 max-w-[90%] ${
            compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
          }`}
        >
          {addrText}
        </div>
      </div>
    </div>
  );
};

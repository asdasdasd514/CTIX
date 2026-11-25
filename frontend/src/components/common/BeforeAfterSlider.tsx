import React, { useRef, useState } from 'react';
import { Columns2, MoveHorizontal, SlidersHorizontal } from 'lucide-react';
import { TimestampWatermark } from './TimestampWatermark';

interface BeforeAfterSliderProps {
  photosBefore: string[];
  photosAfter: string[];
  beforeLabel?: string;
  afterLabel?: string;
  beforeTimestamp?: string;
  afterTimestamp?: string;
  address?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  photosBefore,
  photosAfter,
  beforeLabel = 'TRƯỚC XỬ LÝ',
  afterLabel = 'SAU XỬ LÝ',
  beforeTimestamp,
  afterTimestamp,
  address,
  className = '',
}) => {
  const [position, setPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side'>('slider');
  const [beforeIdx, setBeforeIdx] = useState<number>(0);
  const [afterIdx, setAfterIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!photosBefore.length || !photosAfter.length) return null;

  const beforeUrl = photosBefore[Math.min(beforeIdx, photosBefore.length - 1)];
  const afterUrl = photosAfter[Math.min(afterIdx, photosAfter.length - 1)];

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(2, Math.min(98, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(2, p - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(98, p + 5));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Thanh điều khiển chế độ xem */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>So sánh hiện trường Trước & Sau xử lý</span>
        </div>

        <div className="inline-flex items-center rounded-[5px] border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-[4px] inline-flex items-center gap-1 transition ${
              viewMode === 'slider'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Thanh trượt</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side')}
            className={`px-2.5 py-1 rounded-[4px] inline-flex items-center gap-1 transition ${
              viewMode === 'side'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Song song</span>
          </button>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: THANH TRƯỢT SO SÁNH */}
      {viewMode === 'slider' ? (
        <div className="space-y-1.5">
          <div
            ref={containerRef}
            role="slider"
            tabIndex={0}
            aria-label="Thanh trượt so sánh ảnh trước và sau xử lý"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="relative aspect-[16/9] w-full rounded-[5px] overflow-hidden border border-slate-300 bg-slate-900 select-none touch-none cursor-ew-resize shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {/* Ảnh SAU xử lý (nằm dưới, hiển thị đủ 100%, Watermark đặt góc dưới-PHẢI) */}
            <div className="absolute inset-0 pointer-events-none">
              <img
                src={afterUrl}
                alt="Ảnh sau xử lý"
                draggable={false}
                className="w-full h-full object-cover"
              />
              {afterTimestamp && (
                <TimestampWatermark
                  timestamp={afterTimestamp}
                  address={address}
                  imageUrl={afterUrl}
                  compact
                  align="right"
                  visible={position <= 62}
                />
              )}
            </div>

            {/* Ảnh TRƯỚC xử lý (nằm trên, cắt theo clip-path, Watermark đặt góc dưới-TRÁI) */}
            <div
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              className="absolute inset-0 pointer-events-none"
            >
              <img
                src={beforeUrl}
                alt="Ảnh trước xử lý"
                draggable={false}
                className="w-full h-full object-cover"
              />
              {beforeTimestamp && (
                <TimestampWatermark
                  timestamp={beforeTimestamp}
                  address={address}
                  imageUrl={beforeUrl}
                  compact
                  align="left"
                  visible={position >= 38}
                />
              )}
            </div>

            {/* Nhãn góc TRƯỚC */}
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-rose-600/90 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-black tracking-wide shadow">
                {beforeLabel}
              </span>
            </div>

            {/* Nhãn góc SAU */}
            <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-black tracking-wide shadow">
                {afterLabel}
              </span>
            </div>

            {/* Vạch chia dọc & Tay cầm kéo */}
            <div
              style={{ left: `${position}%` }}
              className="absolute inset-y-0 z-20 -translate-x-1/2 pointer-events-none flex items-center justify-center"
            >
              <div className="w-[2.5px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.65)]" />
              <div
                className={`absolute w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-blue-900 border-2 border-blue-700 shadow-lg flex items-center justify-center transition-transform ${
                  isDragging ? 'scale-110 ring-4 ring-blue-500/35' : ''
                }`}
              >
                <MoveHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Thanh chú thích đặt gọn BÊN DƯỚI khung ảnh — không bao giờ che Watermark */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] bg-slate-100 border border-slate-200 text-slate-600 text-[10px] sm:text-[11px] font-semibold">
              ← Kéo thanh trượt qua lại để so sánh Trước & Sau →
            </span>
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ 2: XEM SONG SONG 2 ẢNH */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative aspect-[16/10] rounded-[5px] overflow-hidden border border-slate-200 bg-slate-100">
            <img src={beforeUrl} alt="Trước xử lý" className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-[5px] bg-rose-600/90 text-white text-[10px] font-black">
              {beforeLabel}
            </span>
            {beforeTimestamp && (
              <TimestampWatermark
                timestamp={beforeTimestamp}
                address={address}
                imageUrl={beforeUrl}
                compact
              />
            )}
          </div>
          <div className="relative aspect-[16/10] rounded-[5px] overflow-hidden border border-emerald-200 bg-emerald-50">
            <img src={afterUrl} alt="Sau xử lý" className="w-full h-full object-cover" />
            <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-[5px] bg-emerald-600/90 text-white text-[10px] font-black">
              {afterLabel}
            </span>
            {afterTimestamp && (
              <TimestampWatermark
                timestamp={afterTimestamp}
                address={address}
                imageUrl={afterUrl}
                compact
              />
            )}
          </div>
        </div>
      )}

      {/* Bộ chọn cặp ảnh nếu có nhiều hơn 1 ảnh Trước hoặc Sau */}
      {(photosBefore.length > 1 || photosAfter.length > 1) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {photosBefore.length > 1 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500">
                Chọn ảnh Trước ({beforeIdx + 1}/{photosBefore.length}):
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {photosBefore.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBeforeIdx(idx)}
                    className={`w-12 h-12 rounded-[5px] overflow-hidden border-2 shrink-0 transition ${
                      idx === beforeIdx
                        ? 'border-rose-600 ring-2 ring-rose-500/30'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt={`Trước ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {photosAfter.length > 1 && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500">
                Chọn ảnh Sau ({afterIdx + 1}/{photosAfter.length}):
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {photosAfter.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAfterIdx(idx)}
                    className={`w-12 h-12 rounded-[5px] overflow-hidden border-2 shrink-0 transition ${
                      idx === afterIdx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt={`Sau ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

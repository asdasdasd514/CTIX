import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface MonthPickerProps {
  value: string; // 'YYYY-MM' hoặc '' (tất cả)
  onChange: (value: string) => void;
  availableMonths?: string[]; // Danh sách 'YYYY-MM' đang có dữ liệu để hiện chấm xanh gợi ý
  ariaLabel?: string;
}

const MONTH_LABELS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function parseYearMonth(val: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(val);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  availableMonths = [],
  ariaLabel = 'Chọn tháng tiếp nhận',
}) => {
  const [open, setOpen] = useState(false);
  const parsed = parseYearMonth(value);
  const now = new Date();
  const defaultYear = parsed?.year || now.getFullYear();
  const [displayYear, setDisplayYear] = useState<number>(defaultYear);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (parsed?.year) setDisplayYear(parsed.year);
  }, [parsed?.year]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const availableSet = new Set(availableMonths);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const displayLabel = parsed
    ? `Tháng ${parsed.month} / ${parsed.year}`
    : 'Tất cả các tháng';

  const handleSelectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    onChange(`${displayYear}-${mm}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-10 px-3 rounded-[5px] border bg-white text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition ${
          open
            ? 'border-blue-600 ring-1 ring-blue-600 text-blue-900'
            : 'border-slate-300 text-slate-800 hover:border-slate-400'
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              title="Xem tất cả các tháng"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Calendar className="w-4 h-4 text-blue-600" />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-full min-w-[268px] max-w-[320px] bg-white rounded-[5px] border border-slate-200 shadow-xl z-40 overflow-hidden">
          {/* Header chọn Năm */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setDisplayYear((y) => y - 1)}
              className="w-7 h-7 rounded-[5px] bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 flex items-center justify-center transition"
              title="Năm trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-black text-slate-900 tracking-wide">
              Năm {displayYear}
            </div>
            <button
              type="button"
              onClick={() => setDisplayYear((y) => y + 1)}
              className="w-7 h-7 rounded-[5px] bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 flex items-center justify-center transition"
              title="Năm sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lưới 12 tháng (3 cột x 4 hàng) */}
          <div className="p-3 grid grid-cols-3 gap-1.5">
            {MONTH_LABELS.map((label, idx) => {
              const key = `${displayYear}-${String(idx + 1).padStart(2, '0')}`;
              const isSelected = value === key;
              const isCurrent = key === currentMonthKey;
              const hasData = availableSet.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`relative py-2 px-1.5 rounded-[5px] text-xs font-bold border transition flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                      : isCurrent
                      ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{label}</span>
                  {hasData && (
                    <span
                      title="Có dữ liệu phản ánh"
                      className={`mt-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer thao tác nhanh */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="px-2.5 py-1 rounded-[4px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
            >
              Tất cả các tháng
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplayYear(now.getFullYear());
                onChange(currentMonthKey);
                setOpen(false);
              }}
              className="px-2.5 py-1 rounded-[4px] font-bold text-blue-700 hover:bg-blue-100/80 transition"
            >
              Tháng này
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload, CheckCircle2, ImagePlus, AlertCircle } from 'lucide-react';
import type { Incident } from '../../types/incident';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { compressImageFile, stampTimestampWatermark } from '../../lib/imageCompress';
import { mediaApi } from '../../services/api';

export function IncidentResolutionModal({
  incident,
  onClose,
}: {
  incident: Incident;
  onClose: () => void;
}) {
  const resolveIncident = useIncidentStore((s) => s.resolveIncident);
  const currentUser = useAuthStore((s) => s.currentUser);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Dọn objectURL cục bộ nếu người dùng đóng modal không gửi (chống rác Cloudinary)
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSelectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressImageFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setStagedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch {
      setError('Không thể đọc tệp ảnh này. Vui lòng thử ảnh khác.');
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!stagedFile) {
      setError('Vui lòng chụp hoặc tải lên ít nhất 1 ảnh nghiệm thu sau khi xử lý.');
      return;
    }
    if (!notes.trim()) {
      setError('Vui lòng nhập nội dung kết quả khắc phục tại hiện trường.');
      return;
    }

    setSubmitting(true);
    try {
      // Đóng dấu Thời gian hoàn thành + Địa chỉ sự cố kiểu Timestamp Camera ngay lúc xác nhận
      const watermarked = await stampTimestampWatermark(stagedFile, {
        timestamp: new Date(),
        address: incident.location.address,
      });

      let finalPhotoUrl = '';
      try {
        const urls = await mediaApi.uploadFiles([watermarked], 'after', incident.category);
        if (urls[0]) finalPhotoUrl = urls[0];
      } catch {
        // Fallback sang dataURL đã nén & đóng dấu khi mất kết nối Cloudinary
        finalPhotoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsDataURL(watermarked);
        });
      }

      if (!finalPhotoUrl) {
        setError('Không thể lưu ảnh nghiệm thu. Vui lòng thử lại.');
        return;
      }

      resolveIncident(incident.id, notes.trim(), [finalPhotoUrl], currentUser.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tất nghiệm thu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resolution-heading"
    >
      <div className="w-full max-w-2xl bg-white rounded-[5px] border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-blue-950 text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-white/15 text-amber-300 border border-white/20">
              Nghiệm thu Before – After • {incident.code}
            </span>
            <h2 id="resolution-heading" className="text-sm sm:text-base font-extrabold mt-1 truncate">
              {incident.title}
            </h2>
            <p className="text-[11px] text-blue-200 truncate mt-0.5">
              {incident.location.address}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-[5px] hover:bg-white/15 text-blue-200 hover:text-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmResolve} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inputs ẩn: Camera gốc điện thoại & Thư viện ảnh */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleSelectPhoto}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleSelectPhoto}
            className="hidden"
          />

          {/* So sánh Trước - Sau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-rose-700 uppercase">
                Ảnh trước xử lý
              </div>
              <div className="aspect-[16/10] rounded-[5px] overflow-hidden border border-slate-200 bg-slate-100">
                {incident.photosBefore[0] ? (
                  <img
                    src={incident.photosBefore[0]}
                    alt="Trước xử lý"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Không có ảnh trước
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-emerald-700 uppercase">
                Ảnh sau xử lý (bắt buộc) *
              </div>
              {previewUrl ? (
                <div className="relative aspect-[16/10] rounded-[5px] overflow-hidden border-2 border-emerald-400 bg-slate-900">
                  <img
                    src={previewUrl}
                    alt="Sau xử lý"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl('');
                      setStagedFile(null);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition"
                    aria-label="Xóa ảnh sau xử lý"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-[5px] border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1.5 text-slate-400 p-3 text-center">
                  <ImagePlus className="w-6 h-6 text-slate-400" />
                  <span className="text-[11px] font-semibold">
                    Chưa có ảnh nghiệm thu
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2 nút chọn ảnh: Camera gốc điện thoại & Tải từ thiết bị */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-2.5 px-3.5 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Mở Camera điện thoại chụp ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 py-2.5 px-3.5 rounded-[5px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span>Tải ảnh từ thiết bị</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Ảnh nghiệm thu sẽ tự động được nén và đóng dấu ngày giờ hoàn thành + địa chỉ hiện trường khi bấm xác nhận.
          </p>

          {/* Ghi chú kết quả */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Nội dung kết quả khắc phục *
            </label>
            <textarea
              required
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Đã thay mới bóng LED 100W tại cột đèn số 14, kiểm tra chiếu sáng ổn định và dọn dẹp sạch hiện trường..."
              className="w-full p-3 rounded-[5px] border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-[5px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-[5px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitting ? 'Đang đóng dấu & tải ảnh...' : 'Xác nhận hoàn thành'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

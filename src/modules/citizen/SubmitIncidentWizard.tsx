import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../../store/useIncidentStore';
import { IncidentCategory, IncidentLocation } from '../../types/incident';
import { OpenStreetMap } from '../../components/Map/OpenStreetMap';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Lightbulb,
  Waves,
  Trash2,
  Construction,
  ArrowRight,
  ArrowLeft,
  Upload,
  Locate,
  Info,
  Clock,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

const CATEGORIES: {
  id: IncidentCategory;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  activeBorder: string;
}[] = [
  {
    id: 'street_light',
    name: 'Đèn đường chiếu sáng',
    desc: 'Mất điện, bóng cháy, chập chờn ban đêm',
    icon: Lightbulb,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    activeBorder: 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/70',
  },
  {
    id: 'flooding',
    name: 'Ngập nước sau mưa',
    desc: 'Đọng nước sâu, cống nghẹt rác',
    icon: Waves,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    activeBorder: 'border-blue-600 ring-1 ring-blue-500 bg-blue-50/70',
  },
  {
    id: 'waste',
    name: 'Rác thải tự phát',
    desc: 'Bãi rác trái phép, phế thải bốc mùi',
    icon: Trash2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    activeBorder: 'border-emerald-600 ring-1 ring-emerald-500 bg-emerald-50/70',
  },
  {
    id: 'road_damage',
    name: 'Mặt đường & Ổ gà',
    desc: 'Mặt đường sụt lún, hố sâu nguy hiểm',
    icon: Construction,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    activeBorder: 'border-rose-600 ring-1 ring-rose-500 bg-rose-50/70',
  },
];

export const SubmitIncidentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { addIncident, elderlyMode } = useIncidentStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80'
  );
  const [photoName, setPhotoName] = useState<string>('anh-hien-truong-1.jpg');
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory>('street_light');
  const [description, setDescription] = useState<string>(
    'Bóng đèn cao áp tại ngõ 2 bị chập chờn và tắt hẳn 3 ngày nay, ban đêm rất tối và nguy hiểm.'
  );
  const [phone, setPhone] = useState<string>('0912.345.678');
  const [senderName, setSenderName] = useState<string>('Bác Hai Trấn Biên');

  const [location, setLocation] = useState<IncidentLocation>({
    lat: 10.9572,
    lng: 106.8184,
    address: '128 Đường Nguyễn Ái Quốc, Khu phố 2, Phường Trấn Biên',
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'duplicate';
    message: string;
    code: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (category: IncidentCategory) => {
    setSelectedCategory(category);
    if (category === 'street_light') {
      setPhotoUrl('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80');
      setDescription('Đèn chiếu sáng công cộng tại ngõ 2 tắt hoàn toàn ban đêm.');
      setPhotoName('anh-mau-den-duong.jpg');
    } else if (category === 'flooding') {
      setPhotoUrl('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80');
      setDescription('Nước ngập nửa bánh xe máy sau cơn mưa lớn, cống thoát nước bị nghẹt.');
      setPhotoName('anh-mau-ngap-nuoc.jpg');
    } else if (category === 'waste') {
      setPhotoUrl('https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=600&auto=format&fit=crop&q=80');
      setDescription('Bãi rác tự phát lớn tràn ra lòng đường, bốc mùi hôi thối.');
      setPhotoName('anh-mau-rac-thai.jpg');
    } else {
      setPhotoUrl('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80');
      setDescription('Hố sụt lún ổ gà sâu giữa đường xe chạy, nguy cơ té ngã cho người tham gia giao thông.');
      setPhotoName('anh-mau-o-ga.jpg');
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setLocation((prev) => ({
      ...prev,
      lat,
      lng,
      address: `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}) • Đang nhận diện địa chỉ...`,
    }));
    setIsGeocoding(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const shortAddress = data.display_name.split(',').slice(0, 3).join(', ');
          setLocation({
            lat,
            lng,
            address: `${shortAddress}, Phường Trấn Biên`,
            ward: 'Phường Trấn Biên',
          });
        }
      }
    } catch {
      setLocation({
        lat,
        lng,
        address: `Khu vực tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)}), Phường Trấn Biên`,
        ward: 'Phường Trấn Biên',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          handleMapClick(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setIsLocating(false);
          handleMapClick(10.9572, 106.8184);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      handleMapClick(10.9572, 106.8184);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addIncident({
      title: `${CATEGORIES.find((c) => c.id === selectedCategory)?.name}: ${description.slice(0, 48)}...`,
      description,
      category: selectedCategory,
      location,
      photosBefore: [photoUrl],
      senderPhone: phone,
      senderName: senderName || 'Công dân ẩn danh',
    });

    if (result.isDuplicateGrouped) {
      setNotification({
        type: 'duplicate',
        message: `Hệ thống phát hiện đã có phản ánh cùng sự cố tại vị trí này (${result.existingCode || 'PA-xxx'}). Đã tự động gộp phản ánh của bạn để tăng độ khẩn cấp!`,
        code: result.existingCode || 'PA-GOP',
      });
    } else {
      setNotification({
        type: 'success',
        message: `Gửi phản ánh thành công! Mã hồ sơ của bạn là ${result.incident.code}. UBND Phường Trấn Biên tiếp nhận xử lý trong thời gian cam kết.`,
        code: result.incident.code,
      });
    }
  };

  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. TIÊU ĐỀ & THANH 2 BƯỚC (GỌN GÀNG, CHỐNG TRÀN MOBILE) */}
      <div className="bg-blue-900 text-white rounded-none p-4 sm:p-6 shadow-sm border border-blue-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-block bg-white/15 text-white text-[10px] font-black px-2 py-0.5 rounded-none uppercase tracking-wider border border-white/20">
              Dịch Vụ Dân Sinh • Phường Trấn Biên
            </span>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight">
              Gửi Phản Ánh Hiện Trường Mới
            </h1>
            <p className="text-xs text-blue-100 font-medium">
              2 bước nhanh chóng: Điền thông tin & tải ảnh, sau đó chọn vị trí trên bản đồ
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-white/10 p-3 rounded-none border border-white/20 text-xs shrink-0">
            <ShieldCheck className="w-7 h-7 text-cyan-300 shrink-0" />
            <div>
              <div className="font-extrabold text-white">Cam kết tiếp nhận & xử lý</div>
              <div className="text-blue-100 text-[11px]">Tiếp nhận trong 2h • Hoàn thành 24h-48h</div>
            </div>
          </div>
        </div>

        {/* Thanh 2 Bước (Xếp dọc trên mobile nhỏ, 2 cột ngang từ sm trở lên) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`p-2.5 sm:p-3 rounded-none text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border ${
              step === 1
                ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm font-black'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <span className="w-5 h-5 rounded-none bg-slate-900/15 flex items-center justify-center text-xs font-black shrink-0">
              1
            </span>
            <span>Bước 1: Thông tin & Ảnh hiện trường</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`p-2.5 sm:p-3 rounded-none text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 border ${
              step === 2
                ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm font-black'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
          >
            <span className="w-5 h-5 rounded-none bg-slate-900/15 flex items-center justify-center text-xs font-black shrink-0">
              2
            </span>
            <span>Bước 2: Chọn vị trí trên bản đồ</span>
          </button>
        </div>
      </div>

      {/* THÔNG BÁO KẾT QUẢ SAU KHI GỬI */}
      {notification && (
        <div
          className={`p-4 sm:p-6 rounded-none border shadow-sm ${
            notification.type === 'duplicate'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <CheckCircle2
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${
                notification.type === 'duplicate' ? 'text-amber-600' : 'text-emerald-600'
              }`}
            />
            <div className="space-y-2 min-w-0 flex-1">
              <h3 className="font-extrabold text-base sm:text-lg">
                {notification.type === 'duplicate'
                  ? 'Đã tự động gộp phản ánh cùng sự cố!'
                  : 'Tiếp nhận phản ánh thành công!'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed">{notification.message}</p>
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => navigate('/citizen/reports')}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Xem hồ sơ trong danh sách Phản ánh</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  onClick={() => {
                    setNotification(null);
                    setStep(1);
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-300 rounded-none text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Gửi thêm phản ánh khác
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BỐ CỤC CHÍNH 2 CỘT (PC: 8/4 | MOBILE: 1 CỘT) */}
      {!notification && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (8 / 12 CỘT): FORM 2 BƯỚC */}
          <div className="lg:col-span-8 bg-white rounded-none border border-slate-200 shadow-sm p-4 sm:p-6 min-w-0">
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Bước 1: Điền thông tin & Tải ảnh hiện trường
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chụp ảnh hoặc tải ảnh thực tế từ điện thoại / máy tính
                    </p>
                  </div>
                  <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-none border border-rose-200 shrink-0">
                    * Bắt buộc
                  </span>
                </div>

                {/* KHUNG TẢI ẢNH */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Ảnh chụp hiện trường sự cố:
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="relative aspect-[16/9] w-full rounded-none overflow-hidden border-2 border-dashed border-slate-300 bg-slate-900 flex items-center justify-center group">
                    <img
                      src={photoUrl}
                      alt="Hiện trường"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-bold shadow-lg transition flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Tải ảnh khác từ máy</span>
                      </button>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto max-w-[90%] bg-slate-900/85 text-white text-xs px-2.5 py-1.5 rounded-none flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{photoName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-none text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-4 h-4 shrink-0" />
                      <span>Chọn ảnh từ máy tính / điện thoại</span>
                    </button>

                    <span className="text-[11px] text-slate-400">hoặc chọn nhanh ảnh mẫu:</span>
                  </div>

                  {/* 4 Nút chọn ảnh mẫu nhanh */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSample('street_light')}
                      className={`p-2 text-[11px] sm:text-xs border rounded-none font-bold text-left transition truncate ${
                        selectedCategory === 'street_light'
                          ? 'border-amber-500 bg-amber-50 text-amber-900'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      💡 Đèn đường
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample('flooding')}
                      className={`p-2 text-[11px] sm:text-xs border rounded-none font-bold text-left transition truncate ${
                        selectedCategory === 'flooding'
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🌊 Ngập úng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample('waste')}
                      className={`p-2 text-[11px] sm:text-xs border rounded-none font-bold text-left transition truncate ${
                        selectedCategory === 'waste'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🗑️ Rác thải
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample('road_damage')}
                      className={`p-2 text-[11px] sm:text-xs border rounded-none font-bold text-left transition truncate ${
                        selectedCategory === 'road_damage'
                          ? 'border-rose-500 bg-rose-50 text-rose-900'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🚧 Ổ gà đường
                    </button>
                  </div>
                </div>

                {/* CHỌN DANH MỤC SỰ CỐ */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Phân loại sự cố:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`p-3 sm:p-3.5 rounded-none border text-left transition flex items-start gap-3 min-w-0 ${
                            isSelected ? cat.activeBorder : 'border-slate-200 hover:border-slate-400 bg-white'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-none flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-700 text-white' : `${cat.bg} ${cat.color}`
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                {cat.name}
                              </span>
                              {isSelected && <span className="text-xs font-bold text-blue-700 shrink-0">✓</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GHI CHÚ */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Ghi chú / Mô tả tình trạng hiện trường: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả cụ thể vị trí cột điện số mấy, kích thước hố sụt hoặc thời điểm ngập nước..."
                    className="w-full p-3 border border-slate-300 rounded-none text-xs sm:text-sm font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                    required
                  />
                </div>

                {/* THÔNG TIN NGƯỜI GỬI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 sm:p-4 rounded-none border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại nhận thông báo: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs sm:text-sm font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ tên người gửi (không bắt buộc):
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Ví dụ: Bác Hai Trấn Biên"
                      className="w-full px-3 py-2 border border-slate-300 rounded-none text-xs sm:text-sm font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* NÚT TIẾP TỤC */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-bold transition shadow-sm active:scale-[0.99] border border-blue-900 ${
                      elderlyMode ? 'text-base' : 'text-xs sm:text-sm'
                    }`}
                  >
                    <span>Tiếp tục: Chọn vị trí trên bản đồ</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN VỊ TRÍ */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Bước 2: Chọn vị trí sự cố trên bản đồ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lấy vị trí hiện tại hoặc nhấp trực tiếp vào bản đồ OpenStreetMap
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-none bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                  >
                    <Locate className={`w-4 h-4 shrink-0 ${isLocating ? 'animate-spin text-amber-500' : 'text-blue-600'}`} />
                    <span>{isLocating ? 'Đang định vị...' : 'Lấy vị trí hiện tại'}</span>
                  </button>
                </div>

                {/* KHUNG BẢN ĐỒ */}
                <div className="rounded-none overflow-hidden border border-slate-300 shadow-sm relative">
                  <OpenStreetMap
                    height="360px"
                    center={[location.lat, location.lng]}
                    zoom={16}
                    singlePin={{
                      lat: location.lat,
                      lng: location.lng,
                      label: location.address,
                    }}
                    onMapClick={handleMapClick}
                    incidents={[]}
                  />
                </div>

                {/* Ô ĐỊA CHỈ */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-none border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Địa chỉ sự cố (tự nhận diện theo điểm ghim):
                    </label>
                    {isGeocoding && (
                      <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                        Đang lấy tên đường...
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-none text-xs sm:text-sm font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                    placeholder="Số nhà, ngõ/hẻm, tên đường..."
                    required
                  />
                  <p className="text-[11px] text-slate-500 italic flex items-start gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>Lia và nhấp vào bản đồ để di chuyển ghim. Bạn có thể gõ bổ sung số nhà nếu cần.</span>
                  </p>
                </div>

                {/* NÚT QUAY LẠI & XÁC NHẬN (XẾP DỌC TRÊN MOBILE, NGANG TRÊN PC) */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-1.5 px-5 py-3 border border-slate-300 text-slate-700 rounded-none text-xs sm:text-sm font-bold hover:bg-slate-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>Quay lại bước 1</span>
                  </button>

                  <button
                    type="submit"
                    className={`px-7 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-black shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.99] border border-blue-900 ${
                      elderlyMode ? 'text-base py-3.5' : 'text-xs sm:text-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                    <span>XÁC NHẬN GỬI PHẢN ÁNH</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CỘT PHẢI (4 / 12 CỘT): XEM TRƯỚC HỒ SƠ */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4 min-w-0">
            <div className="bg-white rounded-none border border-slate-200 border-t-2 border-t-blue-700 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider">
                    Xem trước hồ sơ
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200">
                  Bước {step}/2
                </span>
              </div>

              <div className="aspect-video w-full rounded-none overflow-hidden bg-slate-100 border border-slate-200 relative">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-none font-mono">
                  {currentCategoryObj.name}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium break-words">
                    {location.address}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-600">Thời gian tạo: Ngay bây giờ</span>
                </div>
              </div>

              {description && (
                <div className="p-3 bg-slate-50 rounded-none border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Nội dung ghi chú:</span>
                  <p className="line-clamp-3 italic break-words">"{description}"</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50/70 rounded-none border border-blue-200 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Cam kết phục vụ UBND Phường</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center justify-between p-2 rounded-none bg-white border border-blue-100 gap-2">
                  <span>Tiếp nhận & phân loại:</span>
                  <strong className="text-blue-700 whitespace-nowrap">Trong 2 giờ</strong>
                </div>
                <div className="flex items-center justify-between p-2 rounded-none bg-white border border-blue-100 gap-2">
                  <span>Khắc phục hoàn thành:</span>
                  <strong className="text-emerald-700 whitespace-nowrap">24h - 48h</strong>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-none border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-none bg-rose-50 text-rose-700 flex items-center justify-center font-bold border border-rose-200 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">Tổng đài 1022</div>
                  <div className="text-[11px] text-slate-500 truncate">Tiếp nhận phản ánh 24/7</div>
                </div>
              </div>
              <a
                href="tel:1022"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-none border border-rose-200 text-xs transition whitespace-nowrap shrink-0"
              >
                Gọi 1022
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

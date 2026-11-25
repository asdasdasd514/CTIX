import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident } from '../../types/incident';
import { optimizeCloudinaryUrl } from '../../lib/imageCompress';
import { useNavigate, useLocation } from 'react-router-dom';
import { Locate } from 'lucide-react';

interface OpenStreetMapProps {
  incidents?: Incident[];
  selectedId?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  title?: string;
  now?: number;
  expandable?: boolean;
  showLegend?: boolean;
  emptyMessage?: string;
  onClearFilters?: () => void;
  onMarkerClick?: (incident: Incident) => void;
  onOpenDetail?: (incident: Incident) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onViewChange?: (center: [number, number], zoom: number) => void;
  singlePin?: {
    lat: number;
    lng: number;
    label?: string;
  };
  showLayerToggle?: boolean;
  showLocateButton?: boolean;
  mode?: 'citizen' | 'officer';
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  incidents = [],
  selectedId,
  center = [10.9572, 106.8184],
  zoom = 14,
  height = '360px',
  className = '',
  onMarkerClick,
  onOpenDetail,
  onMapClick,
  onViewChange,
  singlePin,
  showLayerToggle = true,
  showLocateButton = true,
  mode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const onOpenDetailRef = useRef(onOpenDetail);
  onOpenDetailRef.current = onOpenDetail;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const navigate = useNavigate();
  const routeLocation = useLocation();
  const isCitizenMode = mode ? mode === 'citizen' : routeLocation.pathname.startsWith('/citizen');

  const initialLat = singlePin ? singlePin.lat : center[0];
  const initialLng = singlePin ? singlePin.lng : center[1];

  // 1. Khởi tạo bản đồ OpenStreetMap (OSM) + ResizeObserver chống lỗi khung xám/vỡ tile
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!mapInstanceRef.current) {
      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Bản đồ nền đường phố độ nét cao (tối ưu tải tile mượt khi kéo/zoom)
      const streetLayer = L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          keepBuffer: 4,
          updateWhenZooming: false,
          updateWhenIdle: true,
        }
      ).addTo(map);

      tileLayerRef.current = streetLayer;

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      map.on('moveend zoomend', () => {
        if (onViewChangeRef.current) {
          const c = map.getCenter();
          onViewChangeRef.current([c.lat, c.lng], map.getZoom());
        }
      });

      mapInstanceRef.current = map;

      // Cập nhật kích thước 1 lần mượt sau khi mount + debounce ResizeObserver chống gọi dồn
      const rafId = window.requestAnimationFrame(() => map.invalidateSize());
      const t1 = window.setTimeout(() => map.invalidateSize(), 200);
      let resizeTimer: number | null = null;

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (resizeTimer !== null) window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 120);
        });
        resizeObserver.observe(container);
      }

      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(t1);
        if (resizeTimer !== null) window.clearTimeout(resizeTimer);
        if (resizeObserver) resizeObserver.disconnect();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Chuyển đổi giữa Bản đồ đường phố OSM và Ảnh vệ tinh ESRI
  const switchLayer = (type: 'streets' | 'satellite') => {
    if (!mapInstanceRef.current) return;
    setActiveLayer(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (type === 'streets') {
      tileLayerRef.current = L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          keepBuffer: 4,
          updateWhenZooming: false,
          updateWhenIdle: true,
        }
      ).addTo(mapInstanceRef.current);
    } else {
      // Ảnh vệ tinh kết hợp nhãn tên đường tiếng Việt
      tileLayerRef.current = L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          keepBuffer: 4,
          updateWhenZooming: false,
          updateWhenIdle: true,
        }
      ).addTo(mapInstanceRef.current);
    }
  };

  // 3. Nút lấy vị trí hiện tại của thiết bị (GPS)
  const handleGetLocation = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);

          if (onMapClickRef.current) {
            onMapClickRef.current(latitude, longitude);
          }

          const gpsIcon = L.divIcon({
            className: 'custom-gps-pin',
            html: `
              <div class="relative flex items-center justify-center w-7 h-7">
                <span class="absolute w-7 h-7 rounded-full bg-blue-500/40 animate-ping"></span>
                <span class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker([latitude, longitude], { icon: gpsIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup('<b>Vị trí hiện tại của bạn</b>')
            .openPopup();
        }
      },
      () => {
        setIsLocating(false);
        alert('Không thể lấy vị trí GPS hiện tại. Vui lòng cấp quyền vị trí cho trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // 4. Vẽ Marker Single Pin (cho trang chi tiết & bước chọn vị trí)
  const singlePinLat = singlePin?.lat;
  const singlePinLng = singlePin?.lng;
  const singlePinLabel = singlePin?.label;

  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    if (singlePinLat === undefined || singlePinLng === undefined) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const pinIcon = L.divIcon({
      className: 'single-pin-marker',
      html: `
        <div class="flex flex-col items-center">
          <div class="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-rose-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="w-2.5 h-1 rounded-full bg-black/30 mt-0.5"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -40],
    });

    const marker = L.marker([singlePinLat, singlePinLng], { icon: pinIcon })
      .addTo(markersLayer)
      .bindPopup(
        `<div class="p-2 text-xs font-sans text-slate-800 max-w-[220px]"><b class="text-rose-700 block mb-0.5">Vị trí sự cố:</b>${
          singlePinLabel || 'Vị trí sự cố hiện trường'
        }</div>`,
        { className: 'smartcity-osm-popup' }
      );

    mapInstanceRef.current.setView([singlePinLat, singlePinLng], zoom, { animate: false });
    window.setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        marker.openPopup();
      }
    }, 220);
  }, [singlePinLat, singlePinLng, singlePinLabel, zoom]);

  // 5. Vẽ danh sách sự cố trên bản đồ (dùng icon SVG tròn từng loại)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    if (singlePinLat !== undefined && singlePinLng !== undefined) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    incidents.forEach((item) => {
      const isSelected = selectedId === item.id;
      const isResolved = item.status === 'resolved' || item.status === 'closed';

      let markerBg = 'bg-amber-500';
      let markerRing = 'ring-amber-500/30';
      // Icon bóng đèn (Đèn đường)
      let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;

      if (item.category === 'flooding') {
        markerBg = 'bg-blue-600';
        markerRing = 'ring-blue-600/30';
        // Icon sóng nước (Waves - Ngập úng)
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
      } else if (item.category === 'waste') {
        markerBg = 'bg-emerald-600';
        markerRing = 'ring-emerald-600/30';
        // Icon thùng rác (Trash2 - Rác thải)
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
      } else if (item.category === 'road_damage') {
        markerBg = 'bg-rose-600';
        markerRing = 'ring-rose-600/30';
        // Icon cảnh báo ổ gà (TriangleAlert)
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
      } else if (item.category === 'other') {
        markerBg = 'bg-violet-600';
        markerRing = 'ring-violet-600/30';
        // Icon sự cố khác (Info/AlertCircle)
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
      }

      if (isResolved) {
        markerBg = 'bg-emerald-700';
        markerRing = 'ring-emerald-500/30';
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
      }

      const customIcon = L.divIcon({
        className: 'incident-osm-marker',
        html: `
          <div class="relative group cursor-pointer flex items-center justify-center">
            <div class="w-9 h-9 rounded-full ${markerBg} text-white flex items-center justify-center shadow-lg border-2 ${
              isSelected ? 'border-yellow-300 ring-4 ring-yellow-400/50 scale-110 z-50' : `border-white ring-4 ${markerRing}`
            } transition duration-200">
              ${iconSvg}
            </div>
            ${
              item.sameReportsCount > 1
                ? `<span class="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm leading-none">+${item.sameReportsCount}</span>`
                : ''
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon });

      const statusLabel = isResolved
        ? 'Đã hoàn thành'
        : item.status === 'in_progress'
        ? 'Đang khắc phục'
        : 'Đang xử lý';

      const popupButtonLabel = isCitizenMode
        ? 'Xem chi tiết phản ánh →'
        : 'Xem hồ sơ & Phân công →';

      const categoryDisplayName =
        item.category === 'street_light'
          ? 'Đèn đường'
          : item.category === 'flooding'
          ? 'Ngập úng'
          : item.category === 'waste'
          ? 'Rác thải'
          : item.category === 'road_damage'
          ? 'Ổ gà'
          : 'Sự cố khác';

      const popupHeaderLeft = isCitizenMode ? categoryDisplayName : item.code;

      // Lazy Popup: chỉ tạo HTML & tải ảnh thumbnail nhẹ (w_360) đúng lúc bấm vào ghim
      marker.bindPopup(
        () => {
          const thumbUrl = optimizeCloudinaryUrl(item.photosBefore[0], 360);
          return `
            <div class="p-3 max-w-[240px] text-xs font-sans text-slate-800">
              <div class="flex items-center justify-between border-b pb-1 mb-1.5">
                <span class="font-extrabold text-blue-700">${popupHeaderLeft}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                  isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }">${statusLabel}</span>
              </div>
              <div class="font-bold text-slate-900 text-xs line-clamp-1 mb-1">${item.title}</div>
              <div class="text-[11px] text-slate-500 line-clamp-2 mb-2">📍 ${item.location.address}</div>
              <div class="aspect-video w-full rounded-[4px] overflow-hidden mb-2 bg-slate-100 border">
                <img src="${thumbUrl}" loading="lazy" decoding="async" alt="" class="w-full h-full object-cover" />
              </div>
              <button id="btn-action-${item.id}" class="w-full py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-[4px] font-bold text-[11px] text-center transition block">
                ${popupButtonLabel}
              </button>
            </div>
          `;
        },
        { className: 'smartcity-osm-popup' }
      );

      marker.on('click', () => {
        if (onMarkerClickRef.current) onMarkerClickRef.current(item);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-action-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onOpenDetailRef.current) {
              onOpenDetailRef.current(item);
            } else if (isCitizenMode) {
              navigate(`/citizen/reports/${item.id}`);
            } else {
              navigate(`/admin/dispatch/${item.id}`);
            }
          };
        }
      });

      markersLayer.addLayer(marker);

      if (isSelected) {
        window.setTimeout(() => {
          marker.openPopup();
        }, 250);
      }
    });
  }, [incidents, selectedId, singlePinLat, singlePinLng, isCitizenMode, navigate]);

  return (
    <div className={`relative z-10 w-full rounded-[5px] overflow-hidden ${className}`}>
      {/* Khung chứa Leaflet Map */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Cụm công cụ nổi trên bản đồ */}
      <div className="absolute top-2.5 right-2.5 z-[500] flex items-center gap-1.5">
        {showLayerToggle && (
          <div className="bg-white/95 backdrop-blur-sm p-0.5 rounded-[5px] shadow-md border border-slate-300 flex items-center text-[11px] sm:text-xs font-bold">
            <button
              type="button"
              onClick={() => switchLayer('streets')}
              className={`px-2 sm:px-2.5 py-1 rounded-[4px] transition ${
                activeLayer === 'streets'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Đường
            </button>
            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              className={`px-2 sm:px-2.5 py-1 rounded-[4px] transition ${
                activeLayer === 'satellite'
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛰️ Vệ tinh
            </button>
          </div>
        )}

        {showLocateButton && (
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-[5px] bg-white/95 hover:bg-white text-blue-700 shadow-md border border-slate-300 transition active:scale-95 font-bold flex items-center gap-1 text-xs"
            title="Lấy vị trí GPS hiện tại của tôi"
          >
            <Locate className={`w-4 h-4 shrink-0 ${isLocating ? 'animate-spin text-amber-500' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">{isLocating ? 'Đang định vị...' : 'Vị trí của tôi'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

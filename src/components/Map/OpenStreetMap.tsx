import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident } from '../../types/incident';
import { useNavigate } from 'react-router-dom';
import { Layers, Locate, Navigation } from 'lucide-react';

interface OpenStreetMapProps {
  incidents?: Incident[];
  selectedId?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (incident: Incident) => void;
  onMapClick?: (lat: number, lng: number) => void;
  singlePin?: {
    lat: number;
    lng: number;
    label?: string;
  };
  showLayerToggle?: boolean;
  showLocateButton?: boolean;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  incidents = [],
  selectedId,
  center = [10.9572, 106.8184], // Tọa độ trung tâm Phường Trấn Biên (Biên Hòa, Đồng Nai)
  zoom = 14,
  height = '360px',
  className = '',
  onMarkerClick,
  onMapClick,
  singlePin,
  showLayerToggle = true,
  showLocateButton = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const navigate = useNavigate();

  // 1. Khởi tạo bản đồ OpenStreetMap (OSM)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      // Bản đồ nền CartoDB Voyager dựa trên dữ liệu OpenStreetMap thực tế (Tải nhanh, nét, hỗ trợ nhãn tiếng Việt)
      const streetLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> đóng góp &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      tileLayerRef.current = streetLayer;

      // Layer chứa các Marker
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      // Xử lý Click vào bản đồ (Lia map & chọn vị trí bất kỳ)
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      mapInstanceRef.current = map;

      // Resize tự động khi render
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Chuyển đổi lớp bản đồ (Đường phố OSM vs Ảnh vệ tinh ESRI)
  const switchLayer = (type: 'streets' | 'satellite') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (type === 'satellite') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; ESRI Satellite & OpenStreetMap contributors',
          maxZoom: 19,
        }
      ).addTo(map);
      tileLayerRef.current = satLayer;
    } else {
      const streetLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
      tileLayerRef.current = streetLayer;
    }

    setActiveLayer(type);
  };

  // 3. Lấy vị trí GPS hiện tại của người dùng
  const handleGetLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 16);
          if (onMapClickRef.current) {
            onMapClickRef.current(lat, lng);
          }
        },
        (error) => {
          setIsLocating(false);
          // Fallback về trung tâm Phường Trấn Biên nếu trình duyệt chặn GPS
          const defaultLat = 10.9572;
          const defaultLng = 106.8184;
          map.setView([defaultLat, defaultLng], 15);
          if (onMapClickRef.current) {
            onMapClickRef.current(defaultLat, defaultLng);
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setIsLocating(false);
      map.setView([10.9572, 106.8184], 15);
    }
  };

  // 4. Cập nhật vị trí trung tâm khi prop center thay đổi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && center) {
      map.setView(center, zoom);
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [center[0], center[1], zoom]);

  // 5. Render các Marker khi incidents hoặc singlePin thay đổi
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Render singlePin nếu có (dành cho chọn vị trí gửi phản ánh)
    if (singlePin) {
      const singlePinIcon = L.divIcon({
        className: 'custom-single-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl border-2 border-white animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="absolute -bottom-1.5 w-5 h-2 bg-black/40 rounded-full blur-[1px]"></span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 36],
        popupAnchor: [0, -36],
      });

      const pinMarker = L.marker([singlePin.lat, singlePin.lng], { icon: singlePinIcon });
      if (singlePin.label) {
        pinMarker.bindPopup(`
          <div class="p-2.5 text-xs font-sans text-slate-800">
            <div class="font-extrabold text-blue-700 flex items-center gap-1">📍 Vị trí sự cố đã ghim</div>
            <div class="text-slate-700 mt-1 font-medium">${singlePin.label}</div>
            <div class="text-[10px] text-slate-400 mt-1">Tọa độ: ${singlePin.lat.toFixed(4)}, ${singlePin.lng.toFixed(4)}</div>
          </div>
        `);
      }
      markersLayer.addLayer(pinMarker);
    }

    // Render danh sách incidents
    incidents.forEach((item) => {
      const isSelected = selectedId === item.id;
      const isResolved = item.status === 'resolved' || item.status === 'closed';

      let bgClass = 'bg-rose-600';
      let iconEmoji = '🚧';
      if (item.category === 'street_light') {
        bgClass = 'bg-amber-500';
        iconEmoji = '💡';
      } else if (item.category === 'flooding') {
        bgClass = 'bg-blue-600';
        iconEmoji = '🌊';
      } else if (item.category === 'waste') {
        bgClass = 'bg-emerald-600';
        iconEmoji = '🗑️';
      }

      if (isResolved) {
        bgClass = 'bg-emerald-600 ring-2 ring-emerald-300';
      }

      const customIcon = L.divIcon({
        className: 'custom-osm-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
            isSelected ? 'scale-125 z-40' : ''
          }">
            <div class="w-8 h-8 rounded-full ${bgClass} text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">
              <span>${iconEmoji}</span>
            </div>
            ${
              item.sameReportsCount > 1
                ? `<span class="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold px-1 rounded-full border border-white">+${item.sameReportsCount}</span>`
                : ''
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([item.location.lat, item.location.lng], { icon: customIcon });

      const popupHtml = `
        <div class="p-3 max-w-[260px] text-xs font-sans text-slate-800">
          <div class="flex items-center justify-between border-b pb-1 mb-1.5">
            <span class="font-extrabold text-blue-700">${item.code}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${
              isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">${isResolved ? 'Đã hoàn thành' : 'Khẩn cấp'}</span>
          </div>
          <div class="font-bold text-slate-900 text-xs line-clamp-1 mb-1">${item.title}</div>
          <div class="text-[11px] text-slate-500 line-clamp-2 mb-2">📍 ${item.location.address}</div>
          <div class="aspect-video w-full rounded overflow-hidden mb-2 bg-slate-100 border">
            <img src="${item.photosBefore[0]}" alt="" class="w-full h-full object-cover" />
          </div>
          <button id="btn-dispatch-${item.id}" class="w-full py-1.5 bg-[#0f3b7d] hover:bg-blue-700 text-white rounded font-bold text-[11px] text-center transition block">
            Xem hồ sơ & Phân công →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'smartcity-osm-popup' });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(item);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-dispatch-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/dispatch/${item.id}`);
          };
        }
      });

      markersLayer.addLayer(marker);

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    });
  }, [incidents, selectedId, singlePin, onMarkerClick, navigate]);

  return (
    <div className={`relative z-10 rounded-2xl overflow-hidden shadow-2xs ${className}`}>
      {/* Khung chứa Leaflet Map */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Cụm công cụ nổi trên bản đồ (Layer Switcher + Nút Lấy Vị Trí) */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
        {showLayerToggle && (
          <div className="bg-white/95 backdrop-blur-xs p-1 rounded-xl shadow-md border border-slate-200 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => switchLayer('streets')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeLayer === 'streets'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Đường sá
            </button>
            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeLayer === 'satellite'
                  ? 'bg-blue-700 text-white shadow-2xs'
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
            className="p-2 rounded-xl bg-white/95 hover:bg-white text-blue-700 shadow-md border border-slate-200 transition active:scale-95 font-bold flex items-center gap-1 text-xs"
            title="Lấy vị trí GPS hiện tại của tôi"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-amber-500' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">{isLocating ? 'Đang định vị...' : 'Vị trí của tôi'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

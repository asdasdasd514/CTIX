import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident } from '../../types/incident';
import { useNavigate } from 'react-router-dom';
import { Layers, Locate } from 'lucide-react';

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
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>',
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

  // 2. Chuyển đổi giữa Bản đồ đường phố OSM và Ảnh vệ tinh ESRI
  const switchLayer = (type: 'streets' | 'satellite') => {
    if (!mapInstanceRef.current) return;
    setActiveLayer(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (type === 'streets') {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
    } else {
      // ESRI World Imagery (Vệ tinh độ phân giải cao)
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
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

          // Tạo Pulse Marker vị trí hiện tại (GÓC VUÔNG)
          const gpsIcon = L.divIcon({
            className: 'custom-gps-pin',
            html: `
              <div class="relative flex items-center justify-center w-7 h-7">
                <span class="absolute w-7 h-7 bg-blue-500/40 animate-ping"></span>
                <span class="w-4 h-4 bg-blue-600 border-2 border-white shadow-md"></span>
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
      (err) => {
        setIsLocating(false);
        alert('Không thể lấy vị trí GPS hiện tại. Vui lòng cấp quyền vị trí cho trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // 4. Vẽ Marker và Pin sự cố lên bản đồ OpenStreetMap
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // 4.1. Single Pin khi người dùng chọn điểm trong Wizard tạo phản ánh
    if (singlePin) {
      const pinIcon = L.divIcon({
        className: 'single-pin-marker',
        html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="w-2.5 h-1 bg-black/30 mt-0.5"></div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      const pinMarker = L.marker([singlePin.lat, singlePin.lng], { icon: pinIcon })
        .addTo(markersLayer)
        .bindPopup(`<b>Điểm đã chọn:</b><br/>${singlePin.label || 'Vị trí sự cố hiện trường'}`)
        .openPopup();

      mapInstanceRef.current.setView([singlePin.lat, singlePin.lng], 16);
      return;
    }

    // 4.2. Render danh sách phản ánh đô thị lên OpenStreetMap
    incidents.forEach((item) => {
      const isSelected = selectedId === item.id;
      const isResolved = item.status === 'resolved' || item.status === 'closed';

      let markerBg = 'bg-amber-500';
      let iconEmoji = '💡';

      if (item.category === 'flooding') {
        markerBg = 'bg-blue-600';
        iconEmoji = '🌊';
      } else if (item.category === 'waste') {
        markerBg = 'bg-emerald-600';
        iconEmoji = '🗑️';
      } else if (item.category === 'road_damage') {
        markerBg = 'bg-rose-600';
        iconEmoji = '🚧';
      }

      if (isResolved) {
        markerBg = 'bg-emerald-700';
        iconEmoji = '✓';
      }

      const customIcon = L.divIcon({
        className: 'incident-osm-marker',
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 ${markerBg} text-white flex items-center justify-center text-xs shadow-md border-2 ${
              isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 scale-125 z-50' : 'border-white'
            } transition duration-200">
              <span>${iconEmoji}</span>
            </div>
            ${
              item.sameReportsCount > 1
                ? `<span class="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold px-1 border border-white">+${item.sameReportsCount}</span>`
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
            <span class="text-[10px] font-bold px-1.5 py-0.2 ${
              isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }">${isResolved ? 'Đã hoàn thành' : 'Khẩn cấp'}</span>
          </div>
          <div class="font-bold text-slate-900 text-xs line-clamp-1 mb-1">${item.title}</div>
          <div class="text-[11px] text-slate-500 line-clamp-2 mb-2">📍 ${item.location.address}</div>
          <div class="aspect-video w-full overflow-hidden mb-2 bg-slate-100 border">
            <img src="${item.photosBefore[0]}" alt="" class="w-full h-full object-cover" />
          </div>
          <button id="btn-dispatch-${item.id}" class="w-full py-1.5 bg-[#0f3b7d] hover:bg-blue-700 text-white font-bold text-[11px] text-center transition block">
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
    <div className={`relative z-10 rounded-none overflow-hidden shadow-2xs ${className}`}>
      {/* Khung chứa Leaflet Map */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Cụm công cụ nổi trên bản đồ (Layer Switcher + Nút Lấy Vị Trí - GÓC VUÔNG) */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
        {showLayerToggle && (
          <div className="bg-white/95 backdrop-blur-xs p-1 rounded-none shadow-md border border-slate-300 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => switchLayer('streets')}
              className={`px-2.5 py-1 rounded-none transition border ${
                activeLayer === 'streets'
                  ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Đường sá
            </button>
            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              className={`px-2.5 py-1 rounded-none transition border ${
                activeLayer === 'satellite'
                  ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
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
            className="p-2 rounded-none bg-white/95 hover:bg-white text-blue-700 shadow-md border border-slate-300 transition active:scale-95 font-bold flex items-center gap-1 text-xs"
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

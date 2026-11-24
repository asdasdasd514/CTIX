import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { useLocation, useNavigate } from "react-router-dom";
import type { Incident } from "../../types/incident";
import {
  CATEGORIES,
  CATEGORY_CODES,
  MAP_STATUS_ORDER,
  MAP_STATUS_VISUALS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  getIncidentMapVisual,
  isOverdue,
  validCoordinates,
} from "../../lib/incidents";
import {
  Locate,
  LocateFixed,
  Layers,
  RotateCcw,
  AlertTriangle,
  Maximize2,
  X,
  Search,
} from "lucide-react";

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
  singlePin?: { lat: number; lng: number; label?: string };
  showLayerToggle?: boolean;
  showLocateButton?: boolean;
}

const EMPTY: Incident[] = [];
const DEFAULT_CENTER: [number, number] = [10.9572, 106.8184];
const tileUrl = {
  streets:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function OpenStreetMap({
  incidents = EMPTY,
  selectedId,
  center = DEFAULT_CENTER,
  zoom = 14,
  height = "420px",
  className = "",
  title,
  now,
  expandable = false,
  showLegend = false,
  emptyMessage,
  onClearFilters,
  onMarkerClick,
  onOpenDetail,
  onMapClick,
  onViewChange,
  singlePin,
  showLayerToggle = true,
  showLocateButton = true,
}: OpenStreetMapProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const singleMarkerRef = useRef<L.Marker | null>(null);
  const markerDataRef = useRef(new Map<string, Incident>());
  const markerAppearanceRef = useRef(new Map<string, string>());
  const previousSelectionRef = useRef<string | undefined>(undefined);
  const markersRef = useRef(new Map<string, L.Marker>());
  const savedScrollRef = useRef({ x: 0, y: 0 });
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingViewRef = useRef<{ center: L.LatLng; zoom: number } | undefined>(
    undefined,
  );
  const closeOptionsRef = useRef({ restoreFocus: true, restoreScroll: true });
  const wasExpandedRef = useRef(false);

  const clickRef = useRef(onMapClick);
  useEffect(() => {
    clickRef.current = onMapClick;
  }, [onMapClick]);
  const markerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    markerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);
  const openDetailRef = useRef(onOpenDetail);
  useEffect(() => {
    openDetailRef.current = onOpenDetail;
  }, [onOpenDetail]);
  const viewChangeRef = useRef(onViewChange);
  useEffect(() => {
    viewChangeRef.current = onViewChange;
  }, [onViewChange]);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const publicMap = pathname.startsWith("/citizen");
  const [layer, setLayer] = useState<"streets" | "satellite">("streets");
  const [retry, setRetry] = useState(0);
  const [tileError, setTileError] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  const validIncidentsCount = useMemo(
    () =>
      incidents.filter((item) =>
        validCoordinates(item.location.lat, item.location.lng),
      ).length,
    [incidents],
  );
  const invalidCoordsCount = incidents.length - validIncidentsCount;
  const selectedIncident = useMemo(
    () =>
      selectedId
        ? incidents.find(
            (item) =>
              item.id === selectedId &&
              validCoordinates(item.location.lat, item.location.lng),
          )
        : undefined,
    [incidents, selectedId],
  );

  const syncMapSize = useCallback(
    (preserveView?: { center: L.LatLng; zoom: number }) => {
      const map = mapRef.current;
      const el = container.current;
      if (!map || !el || el.clientWidth === 0 || el.clientHeight === 0) return;
      const target = preserveView ?? {
        center: map.getCenter(),
        zoom: map.getZoom(),
      };
      map.invalidateSize({ animate: false, pan: true });
      map.setView(target.center, target.zoom, { animate: false });
    },
    [],
  );

  const openExpanded = useCallback(() => {
    const map = mapRef.current;
    const el = container.current;
    savedScrollRef.current = { x: window.scrollX, y: window.scrollY };
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (map && el && el.clientWidth > 0 && el.clientHeight > 0) {
      pendingViewRef.current = {
        center: map.getCenter(),
        zoom: map.getZoom(),
      };
    }
    setExpanded(true);
  }, []);

  const closeExpanded = useCallback(
    (options?: { restoreFocus?: boolean; restoreScroll?: boolean }) => {
      const map = mapRef.current;
      const el = container.current;
      closeOptionsRef.current = {
        restoreFocus: options?.restoreFocus ?? true,
        restoreScroll: options?.restoreScroll ?? true,
      };
      if (map && el && el.clientWidth > 0 && el.clientHeight > 0) {
        pendingViewRef.current = {
          center: map.getCenter(),
          zoom: map.getZoom(),
        };
      }
      setExpanded(false);
    },
    [],
  );
  const closeExpandedRef = useRef(closeExpanded);
  useEffect(() => {
    closeExpandedRef.current = closeExpanded;
  }, [closeExpanded]);

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, {
      center: DEFAULT_CENTER,
      zoom: 14,
      zoomControl: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      fadeAnimation: false,
    });
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    const markers = markersRef.current;
    const markerData = markerDataRef.current;
    const appearances = markerAppearanceRef.current;
    mapRef.current = map;
    map.on("click", (event: L.LeafletMouseEvent) =>
      clickRef.current?.(event.latlng.lat, event.latlng.lng),
    );
    map.on("moveend", () => {
      const el = container.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      const c = map.getCenter();
      viewChangeRef.current?.([c.lat, c.lng], map.getZoom());
    });
    const observer = new ResizeObserver(() => {
      const el = container.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      map.invalidateSize({ animate: false, pan: true });
    });
    observer.observe(container.current);

    let orientTimer: number | undefined;
    const handleViewportChange = () => {
      syncMapSize();
      window.clearTimeout(orientTimer);
      orientTimer = window.setTimeout(() => syncMapSize(), 180);
    };
    window.addEventListener("orientationchange", handleViewportChange);

    return () => {
      window.clearTimeout(orientTimer);
      window.removeEventListener("orientationchange", handleViewportChange);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markers.clear();
      markerData.clear();
      appearances.clear();
      singleMarkerRef.current = null;
      document.body.classList.remove("map-fullscreen-open");
    };
  }, [syncMapSize]);

  useEffect(() => {
    if (expanded) {
      wasExpandedRef.current = true;
      document.body.classList.add("map-fullscreen-open");
      const view = pendingViewRef.current;
      syncMapSize(view);
      const raf = window.requestAnimationFrame(() => {
        syncMapSize(view);
        closeButtonRef.current?.focus({ preventScroll: true });
      });
      const settle = window.setTimeout(() => {
        syncMapSize(view);
        pendingViewRef.current = undefined;
      }, 90);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeExpanded();
          return;
        }
        if (event.key === "Tab" && shellRef.current) {
          const focusables = Array.from(
            shellRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
          ).filter((el) => el.offsetParent !== null);
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement as HTMLElement | null;
          if (event.shiftKey && (!active || active === first || !shellRef.current.contains(active))) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (!active || active === last || !shellRef.current.contains(active))) {
            event.preventDefault();
            first.focus();
          }
        }
      };
      const handleResize = () => syncMapSize();
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleResize);
      return () => {
        window.cancelAnimationFrame(raf);
        window.clearTimeout(settle);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", handleResize);
        document.body.classList.remove("map-fullscreen-open");
      };
    }

    if (wasExpandedRef.current) {
      wasExpandedRef.current = false;
      document.body.classList.remove("map-fullscreen-open");
      const view = pendingViewRef.current;
      const { restoreFocus, restoreScroll } = closeOptionsRef.current;
      const { x, y } = savedScrollRef.current;
      if (restoreScroll) window.scrollTo(x, y);
      syncMapSize(view);
      const raf = window.requestAnimationFrame(() => {
        if (restoreScroll) window.scrollTo(x, y);
        syncMapSize(view);
        if (restoreFocus) {
          const target =
            previousFocusRef.current && previousFocusRef.current.isConnected
              ? previousFocusRef.current
              : expandButtonRef.current;
          target?.focus({ preventScroll: true });
        }
        pendingViewRef.current = undefined;
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [expanded, closeExpanded, syncMapSize]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setTileError(false);
    setLoading(true);
    const tiles = L.tileLayer(tileUrl[layer], {
      maxZoom: 19,
      attribution:
        layer === "streets"
          ? "Tiles &copy; Esri — HERE, Garmin, USGS, OpenStreetMap contributors"
          : "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
    });
    tiles.on("tileerror", () => {
      setTileError(true);
      setLoading(false);
    });
    tiles.on("loading", () => setLoading(true));
    tiles.on("load", () => setLoading(false));
    tiles.addTo(map);
    return () => {
      tiles.off();
      map.removeLayer(tiles);
    };
  }, [layer, retry]);

  const [centerLat, centerLng] = center;
  useEffect(() => {
    if (validCoordinates(centerLat, centerLng))
      mapRef.current?.setView([centerLat, centerLng], zoom, { animate: false });
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const referenceNow = now ?? Date.now();
    const visibleIds = new Set(
      incidents
        .filter((item) =>
          validCoordinates(item.location.lat, item.location.lng),
        )
        .map((item) => item.id),
    );
    for (const [id, marker] of markersRef.current) {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
        markerDataRef.current.delete(id);
        markerAppearanceRef.current.delete(id);
      }
    }
    for (const item of incidents) {
      if (!validCoordinates(item.location.lat, item.location.lng)) continue;
      const visual = getIncidentMapVisual(item, referenceNow);
      const appearance = `${visual.key}:${item.category}`;
      let marker = markersRef.current.get(item.id);
      if (!marker || markerAppearanceRef.current.get(item.id) !== appearance) {
        const icon = L.divIcon({
          className: `incident-map-marker status-${visual.key}`,
          html: `<span class="marker-body shape-${visual.shape}" style="background:${visual.color}"><span class="marker-cat">${CATEGORY_CODES[item.category]}</span><em class="marker-sym" aria-hidden="true">${visual.symbol}</em></span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -18],
        });
        if (marker) marker.setIcon(icon);
        else {
          marker = L.marker([item.location.lat, item.location.lng], {
            icon,
            title: `${item.code} · ${visual.label} · ${CATEGORIES[item.category]} — ${item.title}`,
            alt: `${item.code} (${visual.label})`,
            autoPanOnFocus: false,
          }).addTo(map);
          marker.on("click", () => {
            const latest = markerDataRef.current.get(item.id);
            if (latest) markerClickRef.current?.(latest);
          });
          markersRef.current.set(item.id, marker);
        }
        markerAppearanceRef.current.set(item.id, appearance);
      }
      const position = marker.getLatLng();
      if (
        position.lat !== item.location.lat ||
        position.lng !== item.location.lng
      ) {
        marker.setLatLng([item.location.lat, item.location.lng]);
      }
      if (markerDataRef.current.get(item.id) === item) continue;
      markerDataRef.current.set(item.id, item);
      marker
        .getElement()
        ?.setAttribute(
          "title",
          `${item.code} · ${visual.label} · ${CATEGORIES[item.category]} — ${item.title}`,
        );
      const popup = document.createElement("div");
      popup.className = "map-summary";
      const header = document.createElement("div");
      header.className = "map-summary-head";
      const code = document.createElement("strong");
      code.textContent = item.code;
      const badge = document.createElement("span");
      badge.className = `map-summary-status status-${visual.key}`;
      const overdue = isOverdue(item, referenceNow);
      badge.textContent = `${visual.symbol} ${STATUS_LABELS[item.status]}${
        overdue
          ? " · Quá hạn"
          : item.priority === "urgent"
            ? " · Khẩn cấp"
            : ""
      }`;
      header.append(code, badge);
      popup.append(header);

      const meta = document.createElement("p");
      meta.className = "map-summary-meta";
      meta.textContent = `${CATEGORIES[item.category]} · ${PRIORITY_LABELS[item.priority]}`;
      popup.append(meta);

      const heading = document.createElement("h3");
      heading.textContent = item.title;
      popup.append(heading);

      const address = document.createElement("p");
      address.textContent = item.location.address;
      popup.append(address);

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = publicMap ? "Xem tiến độ phản ánh" : "Mở hồ sơ";
      button.onclick = () => {
        const latest = markerDataRef.current.get(item.id) ?? item;
        if (openDetailRef.current) {
          if (expandedRef.current) {
            closeExpandedRef.current({
              restoreFocus: false,
              restoreScroll: false,
            });
          }
          openDetailRef.current(latest);
        } else if (markerClickRef.current) {
          markerClickRef.current(latest);
        } else {
          navigate(
            publicMap
              ? `/citizen/reports?id=${encodeURIComponent(latest.id)}`
              : `/dispatch/${encodeURIComponent(latest.id)}`,
          );
        }
      };
      popup.append(button);
      if (marker.getPopup()) marker.setPopupContent(popup);
      else marker.bindPopup(popup, { maxWidth: 250, autoPan: false });
    }
  }, [incidents, navigate, now, publicMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle("is-selected", id === selectedId);
      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
      if (
        id === selectedId &&
        selectedId !== previousSelectionRef.current &&
        container.current &&
        container.current.clientWidth > 0 &&
        map.getBounds().contains(marker.getLatLng())
      ) {
        const pt = map.latLngToContainerPoint(marker.getLatLng());
        const size = map.getSize();
        // Chỉ tự mở popup khi đủ khoảng trống hiển thị trọn vẹn, tránh bị cắt ở mép bản đồ.
        if (pt.y >= 190 && pt.x >= 135 && pt.x <= size.x - 135) {
          marker.openPopup();
        }
      }
      if (id !== selectedId && marker.isPopupOpen()) marker.closePopup();
    });
    previousSelectionRef.current = selectedId;
  }, [selectedId, incidents]);

  const pinLat = singlePin?.lat;
  const pinLng = singlePin?.lng;
  const pinLabel = singlePin?.label;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (
      pinLat === undefined ||
      pinLng === undefined ||
      !validCoordinates(pinLat, pinLng)
    ) {
      singleMarkerRef.current?.remove();
      singleMarkerRef.current = null;
      return;
    }
    let marker = singleMarkerRef.current;
    if (!marker) {
      marker = L.marker([pinLat, pinLng], {
        autoPanOnFocus: false,
        icon: L.divIcon({
          className: "incident-map-marker is-selected",
          html: '<span class="marker-body shape-alert" style="background:#be123c"><span class="marker-cat">●</span></span>',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -18],
        }),
      }).addTo(map);
      singleMarkerRef.current = marker;
    } else if (
      marker.getLatLng().lat !== pinLat ||
      marker.getLatLng().lng !== pinLng
    ) {
      marker.setLatLng([pinLat, pinLng]);
    }
    if (pinLabel) {
      const label = document.createElement("span");
      label.textContent = pinLabel;
      if (marker.getPopup()) marker.setPopupContent(label);
      else marker.bindPopup(label, { autoPan: false });
    }
  }, [pinLat, pinLng, pinLabel]);

  function focusSelected() {
    if (!selectedId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    mapRef.current.panTo(marker.getLatLng(), { animate: false });
    marker.openPopup();
  }

  function locate() {
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError(
        "Trình duyệt chưa hỗ trợ GPS. Vui lòng chọn vị trí thủ công trên bản đồ.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude: lat, longitude: lng } = position.coords;
        mapRef.current?.setView([lat, lng], 16, { animate: false });
        clickRef.current?.(lat, lng);
      },
      (error) => {
        setLocating(false);
        setGpsError(
          error.code === 1
            ? "Quyền GPS bị từ chối. Bật định vị trình duyệt hoặc chọn vị trí thủ công trên bản đồ."
            : "Chưa lấy được vị trí GPS lúc này. Thử lại hoặc chọn thủ công trên bản đồ.",
        );
      },
      { timeout: 7000, enableHighAccuracy: true },
    );
  }

  const showEmptyOverlay =
    !singlePin && !onMapClick && validIncidentsCount === 0 && !!emptyMessage;

  return (
    <div
      ref={shellRef}
      className={`map-shell ${expanded ? "is-expanded" : ""} ${className}`}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "Bản đồ phản ánh toàn màn hình" : undefined}
    >
      <div className="map-bar">
        <div className="map-bar-main">
          {title && <span className="map-bar-title">{title}</span>}
          {expandable &&
            (expanded ? (
              <button
                ref={closeButtonRef}
                type="button"
                className="map-btn map-btn-primary"
                aria-label="Đóng bản đồ toàn màn hình"
                onClick={() => closeExpanded()}
              >
                <X size={16} aria-hidden="true" />
                <span>Đóng bản đồ</span>
              </button>
            ) : (
              <button
                ref={expandButtonRef}
                type="button"
                className="map-btn map-btn-primary"
                onClick={openExpanded}
              >
                <Maximize2 size={16} aria-hidden="true" />
                <span>Mở rộng bản đồ</span>
              </button>
            ))}
        </div>
        <div className="map-bar-actions">
          {selectedIncident && (
            <button
              type="button"
              className="map-btn"
              onClick={focusSelected}
            >
              <LocateFixed size={16} aria-hidden="true" />
              <span>Về điểm đã chọn</span>
            </button>
          )}
          {showLayerToggle && (
            <button
              type="button"
              className="map-btn"
              aria-pressed={layer === "satellite"}
              onClick={() =>
                setLayer(layer === "streets" ? "satellite" : "streets")
              }
            >
              <Layers size={16} aria-hidden="true" />
              <span>{layer === "streets" ? "Vệ tinh" : "Đường phố"}</span>
            </button>
          )}
          {showLocateButton && (
            <button
              type="button"
              className="map-btn"
              onClick={locate}
              disabled={locating}
            >
              <Locate size={16} aria-hidden="true" />
              <span>{locating ? "Đang định vị…" : "Vị trí của tôi"}</span>
            </button>
          )}
        </div>
      </div>

      {(tileError || gpsError || invalidCoordsCount > 0) && (
        <div className="map-status-stack">
          {tileError && (
            <div className="map-message" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                Chưa tải được nền bản đồ. Bạn vẫn có thể xem danh sách hồ sơ và
                thử tải lại.
              </span>
              <button type="button" onClick={() => setRetry((n) => n + 1)}>
                <RotateCcw size={15} aria-hidden="true" />
                Thử lại
              </button>
            </div>
          )}
          {gpsError && (
            <div className="map-message" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{gpsError}</span>
              <button type="button" onClick={() => setGpsError("")}>
                Đóng
              </button>
            </div>
          )}
          {invalidCoordsCount > 0 && (
            <div className="map-message" role="status">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                Có {invalidCoordsCount} hồ sơ thiếu tọa độ hợp lệ nên chưa hiện
                ghim.
              </span>
            </div>
          )}
        </div>
      )}

      <div className="map-canvas-wrap">
        <div
          ref={container}
          className="map-canvas"
          style={expanded ? undefined : { height, width: "100%" }}
          aria-label="Bản đồ phản ánh hiện trường"
        />
        {loading && !tileError && (
          <span className="map-loading" role="status">
            Đang tải nền bản đồ…
          </span>
        )}
        {showEmptyOverlay && (
          <div className="map-empty-overlay" role="status">
            <Search size={20} aria-hidden="true" />
            <div>
              <strong>Không có kết quả trên bản đồ</strong>
              <p>{emptyMessage}</p>
            </div>
            {onClearFilters && (
              <button
                type="button"
                className="work-secondary"
                onClick={onClearFilters}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="work-map-legend" aria-label="Chú giải ghim bản đồ">
          {MAP_STATUS_ORDER.map((key) => {
            const visual = MAP_STATUS_VISUALS[key];
            return (
              <span key={key} className="legend-item">
                <i
                  className={`legend-pin shape-${visual.shape}`}
                  style={{ background: visual.color }}
                  aria-hidden="true"
                >
                  {visual.symbol}
                </i>
                <span>{visual.label}</span>
              </span>
            );
          })}
          <span className="legend-categories">
            Đ: Đèn · N: Ngập · R: Rác · M: Mặt đường
          </span>
        </div>
      )}
    </div>
  );
}

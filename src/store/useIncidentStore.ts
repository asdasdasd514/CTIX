import { create } from 'zustand';
import { Incident, IncidentCategory, IncidentStatus, NewIncidentInput, UserRole } from '../types/incident';
import { generateMockIncidents } from '../data/mockIncidents';

const STORAGE_KEY = 'tran_bien_smart_incidents_v1';

interface IncidentStore {
  incidents: Incident[];
  currentRole: UserRole;
  elderlyMode: boolean;
  selectedIncidentId: string | null;
  activeCitizenTab: 'submit' | 'my-reports' | 'map';
  searchQuery: string;
  categoryFilter: IncidentCategory | 'all';
  statusFilter: IncidentStatus | 'all';
  sidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setCurrentRole: (role: UserRole) => void;
  setElderlyMode: (enabled: boolean) => void;
  toggleElderlyMode: () => void;
  setSelectedIncidentId: (id: string | null) => void;
  setActiveCitizenTab: (tab: 'submit' | 'my-reports' | 'map') => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (cat: IncidentCategory | 'all') => void;
  setStatusFilter: (status: IncidentStatus | 'all') => void;

  // Nghiệp vụ cốt lõi
  addIncident: (input: NewIncidentInput) => { incident: Incident; isDuplicateGrouped: boolean; existingCode?: string };
  assignIncident: (id: string, unitName: string, deadlineDays: number, officerName?: string) => void;
  verifyIncident: (id: string, notes?: string) => void;
  resolveIncident: (id: string, notes: string, photosAfter: string[], officerName?: string) => void;
  rateIncident: (id: string, stars: number, criteria: string[], comment?: string) => void;
  upvoteIncident: (id: string) => void;
  addIncidentPhotos: (id: string, newPhotos: string[]) => void;
  updateIncidentDescription: (id: string, description: string, title?: string) => void;
  deleteIncident: (id: string) => void;
  resetToDefaultData: () => void;
}

// Tính khoảng cách Haversine (km) giữa 2 tọa độ
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function loadSavedIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc dữ liệu từ LocalStorage, dùng dữ liệu mẫu mặc định:', err);
  }
  const initial = generateMockIncidents();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export const useIncidentStore = create<IncidentStore>((set, get) => ({
  incidents: loadSavedIncidents(),
  currentRole: 'citizen',
  elderlyMode: false,
  selectedIncidentId: null,
  activeCitizenTab: 'submit',
  searchQuery: '',
  categoryFilter: 'all',
  statusFilter: 'all',
  sidebarCollapsed: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentRole: (role) => set({ currentRole: role }),

  setElderlyMode: (enabled) => {
    if (enabled) {
      document.body.classList.add('elderly-mode');
    } else {
      document.body.classList.remove('elderly-mode');
    }
    set({ elderlyMode: enabled });
  },

  toggleElderlyMode: () => {
    const next = !get().elderlyMode;
    get().setElderlyMode(next);
  },

  setSelectedIncidentId: (id) => set({ selectedIncidentId: id }),
  setActiveCitizenTab: (tab) => set({ activeCitizenTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  // [ĐIỂM CỘNG 2]: Tự động phát hiện và gộp phản ánh trùng vị trí (< 50 mét)
  addIncident: (input) => {
    const { incidents } = get();
    const thresholdKm = 0.05; // 50 mét

    // Tìm xem đã có phản ánh nào cùng danh mục trong bán kính 50m chưa
    const duplicate = incidents.find(
      (item) =>
        item.category === input.category &&
        item.status !== 'resolved' &&
        item.status !== 'closed' &&
        getDistanceKm(item.location.lat, item.location.lng, input.location.lat, input.location.lng) <= thresholdKm
    );

    if (duplicate) {
      // Gộp vào phản ánh đã có, tăng số lượt đồng phản ánh (+1)
      const updated = incidents.map((item) =>
        item.id === duplicate.id
          ? {
              ...item,
              sameReportsCount: item.sameReportsCount + 1,
              priority: (item.priority === 'normal' ? 'high' : 'urgent') as any,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ incidents: updated });
      return { incident: duplicate, isDuplicateGrouped: true, existingCode: duplicate.code };
    }

    // Tạo mới nếu không trùng
    const newCount = incidents.length + 1;
    const code = `TB-2026-${String(newCount).padStart(3, '0')}`;
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      code,
      title: input.title || `Phản ánh sự cố tại ${input.location.address}`,
      description: input.description,
      category: input.category,
      status: 'pending',
      priority: 'normal',
      location: input.location,
      sender: {
        name: input.senderName || 'Người dân Phường Trấn Biên',
        phone: input.senderPhone,
      },
      photosBefore: input.photosBefore.length > 0 ? input.photosBefore : [
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60'
      ],
      sameReportsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newIncident, ...incidents];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated, selectedIncidentId: newIncident.id, activeCitizenTab: 'my-reports' });
    return { incident: newIncident, isDuplicateGrouped: false };
  },

  assignIncident: (id, unitName, deadlineDays, officerName = 'Cán bộ Nguyễn Hữu Nghĩa') => {
    const deadline = new Date(Date.now() + deadlineDays * 24 * 3600 * 1000).toISOString();
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'assigned' as IncidentStatus,
            assignedTo: {
              unitName,
              officerName,
              assignedAt: new Date().toISOString(),
              deadline,
            },
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated });
  },

  verifyIncident: (id, notes) => {
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            verifiedByVolunteer: true,
            status: item.status === 'pending' ? 'in_progress' : item.status,
            description: notes ? `${item.description}\n[Xác minh tại chỗ: ${notes}]` : item.description,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated });
  },

  resolveIncident: (id, notes, photosAfter, officerName = 'Tổ Cơ động Phường Trấn Biên') => {
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'resolved' as IncidentStatus,
            photosAfter: photosAfter.length > 0 ? photosAfter : [
              'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=500&auto=format&fit=crop&q=60'
            ],
            resolution: {
              notes,
              resolvedAt: new Date().toISOString(),
              officerName,
            },
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated });
  },

  rateIncident: (id, stars, criteria, comment) => {
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'closed' as IncidentStatus,
            rating: {
              stars,
              criteria,
              comment,
              ratedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated });
  },

  upvoteIncident: (id) => {
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            sameReportsCount: item.sameReportsCount + 1,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ incidents: updated });
  },

  addIncidentPhotos: (id, newPhotos) => {
    if (!newPhotos.length) return;
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            photosBefore: [...item.photosBefore, ...newPhotos],
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ incidents: updated });
  },

  updateIncidentDescription: (id, description, title) => {
    const updated = get().incidents.map((item) =>
      item.id === id
        ? {
            ...item,
            ...(title ? { title } : {}),
            description,
            updatedAt: new Date().toISOString(),
          }
        : item
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ incidents: updated });
  },

  deleteIncident: (id) => {
    const updated = get().incidents.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    set({ incidents: updated });
  },

  resetToDefaultData: () => {
    const fresh = generateMockIncidents();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    set({ incidents: fresh });
  },
}));

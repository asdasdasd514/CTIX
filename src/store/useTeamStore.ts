import { create } from 'zustand';
import { DEMO_UNITS, type DemoUnit } from '../lib/incidents';
import type { IncidentCategory } from '../types/incident';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  unitId: string;
  status: 'available' | 'busy' | 'off_duty';
}

export interface TeamUnit {
  id: string;
  name: string;
  category: IncidentCategory;
  description: string;
  hotline: string;
}

interface TeamState {
  units: TeamUnit[];
  members: StaffMember[];
  addMember: (member: Omit<StaffMember, 'id'>) => void;
  updateMember: (id: string, patch: Partial<Omit<StaffMember, 'id'>>) => void;
  removeMember: (id: string) => void;
  addUnit: (unit: Omit<TeamUnit, 'id'>) => void;
  updateUnit: (id: string, patch: Partial<Omit<TeamUnit, 'id'>>) => void;
  removeUnit: (id: string) => void;
  resetTeams: () => void;
}

const STORAGE_KEY = 'ctix_teams_v1';

const DEFAULT_PHONES = [
  '0912.839.888',
  '0908.411.233',
  '0918.552.190',
  '0977.304.889',
  '0909.612.445',
  '0933.210.774',
  '0914.782.331',
  '0968.119.502',
  '0903.448.920',
  '0982.615.308',
];

const DEFAULT_UNIT_META: Record<string, { description: string; hotline: string }> = {
  'unit-light': {
    description: 'Kiểm tra, sửa chữa hệ thống đèn chiếu sáng công cộng và tủ điện đường phố.',
    hotline: '0251.382.1101',
  },
  'unit-flood': {
    description: 'Khơi thông cống rãnh, xử lý điểm ngập cục bộ và nắp hố ga trên địa bàn phường.',
    hotline: '0251.382.1102',
  },
  'unit-waste': {
    description: 'Thu gom rác tồn lưu, xử lý điểm tập kết rác tự phát và giữ vệ sinh đô thị.',
    hotline: '0251.382.1103',
  },
  'unit-road': {
    description: 'Duy tu mặt đường, vá ổ gà, chỉnh trang vỉa hè và biển báo giao thông.',
    hotline: '0251.382.1104',
  },
  'unit-other': {
    description: 'Tiếp ứng nhanh các sự cố hạ tầng phát sinh và phối hợp liên ngành.',
    hotline: '0251.382.1105',
  },
};

function buildInitialData(demoUnits: DemoUnit[]): { units: TeamUnit[]; members: StaffMember[] } {
  const units: TeamUnit[] = demoUnits.map((u) => ({
    id: u.id,
    name: u.name,
    category: u.category,
    description:
      DEFAULT_UNIT_META[u.id]?.description || 'Tổ đội tiếp ứng xử lý sự cố hạ tầng đô thị.',
    hotline: DEFAULT_UNIT_META[u.id]?.hotline || '0251.382.1100',
  }));

  const members: StaffMember[] = [];
  let idx = 0;
  demoUnits.forEach((u) => {
    u.staff.forEach((s) => {
      members.push({
        id: s.id,
        name: s.name,
        role: s.role,
        phone: DEFAULT_PHONES[idx % DEFAULT_PHONES.length],
        unitId: u.id,
        status: 'available',
      });
      idx++;
    });
  });

  return { units, members };
}

function loadInitial(): { units: TeamUnit[]; members: StaffMember[] } {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.units) && Array.isArray(parsed?.members)) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }
  return buildInitialData(DEMO_UNITS);
}

function persist(units: TeamUnit[], members: StaffMember[]) {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ units, members }));
    } catch {
      // ignore quota error
    }
  }
}

const initial = loadInitial();

export const useTeamStore = create<TeamState>((set, get) => ({
  units: initial.units,
  members: initial.members,

  addMember: (member) => {
    const newMember: StaffMember = {
      ...member,
      id: `staff-${Date.now().toString(36)}`,
    };
    const nextMembers = [newMember, ...get().members];
    persist(get().units, nextMembers);
    set({ members: nextMembers });
  },

  updateMember: (id, patch) => {
    const nextMembers = get().members.map((m) => (m.id === id ? { ...m, ...patch } : m));
    persist(get().units, nextMembers);
    set({ members: nextMembers });
  },

  removeMember: (id) => {
    const nextMembers = get().members.filter((m) => m.id !== id);
    persist(get().units, nextMembers);
    set({ members: nextMembers });
  },

  addUnit: (unit) => {
    const newUnit: TeamUnit = {
      ...unit,
      id: `unit-${Date.now().toString(36)}`,
    };
    const nextUnits = [...get().units, newUnit];
    persist(nextUnits, get().members);
    set({ units: nextUnits });
  },

  updateUnit: (id, patch) => {
    const nextUnits = get().units.map((u) => (u.id === id ? { ...u, ...patch } : u));
    persist(nextUnits, get().members);
    set({ units: nextUnits });
  },

  removeUnit: (id) => {
    const nextUnits = get().units.filter((u) => u.id !== id);
    const nextMembers = get().members.filter((m) => m.unitId !== id);
    persist(nextUnits, nextMembers);
    set({ units: nextUnits, members: nextMembers });
  },

  resetTeams: () => {
    const fresh = buildInitialData(DEMO_UNITS);
    persist(fresh.units, fresh.members);
    set(fresh);
  },
}));

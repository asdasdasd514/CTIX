import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  role: 'officer' | 'leader' | 'volunteer' | 'citizen';
  department: string;
  phone: string;
  email: string;
}

export const PRESET_ACCOUNTS: Record<string, UserProfile> = {
  officer: {
    id: 'u-long',
    name: 'Nguyễn Thành Long',
    title: 'Cán bộ Tiếp nhận & Phân loại',
    role: 'officer',
    department: 'UBND Phường Trấn Biên',
    phone: '0912.888.999',
    email: 'long.nt@tranbien.dongnai.gov.vn',
  },
  leader: {
    id: 'u-minh',
    name: 'Trần Văn Minh',
    title: 'Cán bộ Điều hành Chủ Trì (IOC)',
    role: 'leader',
    department: 'Trung tâm IOC Tỉnh Đồng Nai',
    phone: '0903.111.222',
    email: 'minh.tv@dongnai.gov.vn',
  },
  volunteer: {
    id: 'u-nam',
    name: 'Lê Hoàng Nam',
    title: 'Đội trưởng Thanh niên Tình nguyện',
    role: 'volunteer',
    department: 'Đoàn Thanh niên Phường Trấn Biên',
    phone: '0977.333.444',
    email: 'nam.lh@doan.tranbien.vn',
  },
  citizen: {
    id: 'u-dan',
    name: 'Bác Hai Trấn Biên',
    title: 'Công dân Phường Trấn Biên',
    role: 'citizen',
    department: 'Khu phố 2, Phường Trấn Biên',
    phone: '0988.555.666',
    email: 'bachai.tranbien@gmail.com',
  },
};

interface AuthState {
  currentUser: UserProfile;
  loginAs: (role: keyof typeof PRESET_ACCOUNTS) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: PRESET_ACCOUNTS.officer,
  loginAs: (role) => set({ currentUser: PRESET_ACCOUNTS[role] }),
  logout: () => set({ currentUser: PRESET_ACCOUNTS.citizen }),
}));

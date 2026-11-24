import { create } from "zustand";

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  role: "officer" | "leader" | "volunteer" | "citizen";
  department: string;
  phone: string;
  email: string;
}

export const PRESET_ACCOUNTS: Record<string, UserProfile> = {
  officer: {
    id: "u-long",
    name: "Nguyễn Thành Long",
    title: "Cán bộ Tiếp nhận & Phân loại",
    role: "officer",
    department: "UBND Phường Trấn Biên",
    phone: "0912.888.999",
    email: "long.nt@tranbien.dongnai.gov.vn",
  },
  leader: {
    id: "u-minh",
    name: "Trần Văn Minh",
    title: "Cán bộ Điều hành Chủ Trì (IOC)",
    role: "leader",
    department: "Trung tâm IOC Tỉnh Đồng Nai",
    phone: "0903.111.222",
    email: "minh.tv@dongnai.gov.vn",
  },
  volunteer: {
    id: "u-nam",
    name: "Lê Hoàng Nam",
    title: "Đội trưởng Thanh niên Tình nguyện",
    role: "volunteer",
    department: "Đoàn Thanh niên Phường Trấn Biên",
    phone: "0977.333.444",
    email: "nam.lh@doan.tranbien.vn",
  },
  citizen: {
    id: "u-dan",
    name: "Bác Hai Trấn Biên",
    title: "Công dân Phường Trấn Biên",
    role: "citizen",
    department: "Khu phố 2, Phường Trấn Biên",
    phone: "0988.555.666",
    email: "bachai.tranbien@gmail.com",
  },
};

interface AuthState {
  currentUser: UserProfile;
  loginAs: (role: keyof typeof PRESET_ACCOUNTS) => void;
  logout: () => void;
}

const routeRole = location.pathname.startsWith("/citizen")
  ? "citizen"
  : location.pathname.includes("/field")
    ? "volunteer"
    : "officer";
let savedRole: string = routeRole;
try {
  const saved = sessionStorage.getItem("ctix_demo_role");
  if (saved && Object.hasOwn(PRESET_ACCOUNTS, saved)) savedRole = saved;
} catch {
  /* Vai trò vẫn dùng được khi bộ nhớ phiên bị chặn. */
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: PRESET_ACCOUNTS[savedRole],
  loginAs: (role) => {
    if (!Object.hasOwn(PRESET_ACCOUNTS, role)) return;
    try {
      sessionStorage.setItem("ctix_demo_role", role);
    } catch {
      /* Không chặn luồng demo. */
    }
    set({ currentUser: PRESET_ACCOUNTS[role] });
  },
  logout: () => {
    try {
      sessionStorage.removeItem("ctix_demo_role");
    } catch {
      /* Không chặn đăng xuất. */
    }
    set({ currentUser: PRESET_ACCOUNTS.citizen });
  },
}));

import { create } from "zustand";
import { authApi, setAuthToken } from "../services/api";

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
    title: "Cán bộ Quản trị & Điều phối",
    role: "officer",
    department: "UBND Phường Trấn Biên",
    phone: "0912888999",
    email: "admin@tranbien.gov.vn",
  },
  leader: {
    id: "u-minh",
    name: "Trần Văn Minh",
    title: "Cán bộ Điều hành Chủ Trì (IOC)",
    role: "leader",
    department: "Trung tâm IOC Tỉnh Đồng Nai",
    phone: "0903111222",
    email: "ioc@dongnai.gov.vn",
  },
  volunteer: {
    id: "u-nam",
    name: "Lê Hoàng Nam",
    title: "Đội trưởng Thanh niên Tình nguyện",
    role: "volunteer",
    department: "Đoàn Thanh niên Phường Trấn Biên",
    phone: "0977333444",
    email: "doan@tranbien.gov.vn",
  },
  citizen: {
    id: "u-dan",
    name: "Bác Hai Trấn Biên",
    title: "Công dân Phường Trấn Biên",
    role: "citizen",
    department: "Khu phố 2, Phường Trấn Biên",
    phone: "0988555666",
    email: "congdan@tranbien.vn",
  },
};

interface AuthState {
  isAuthenticated: boolean;
  currentUser: UserProfile;
  loginAs: (role: keyof typeof PRESET_ACCOUNTS) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<UserProfile>;
  registerCitizen: (payload: {
    name?: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => Promise<UserProfile>;
  logout: () => void;
}

const SESSION_KEY = "ctix_auth_role_v1";
const USER_KEY = "ctix_auth_user_v1";

let initialUser: UserProfile | null = null;
try {
  const savedUser = sessionStorage.getItem(USER_KEY);
  if (savedUser) {
    initialUser = JSON.parse(savedUser) as UserProfile;
  } else {
    const savedRole = sessionStorage.getItem(SESSION_KEY);
    if (savedRole && Object.hasOwn(PRESET_ACCOUNTS, savedRole)) {
      initialUser = PRESET_ACCOUNTS[savedRole];
    }
  }
} catch {
  initialUser = null;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: initialUser !== null,
  currentUser: initialUser || PRESET_ACCOUNTS.citizen,

  loginAs: (role) => {
    if (!Object.hasOwn(PRESET_ACCOUNTS, role)) return;
    const preset = PRESET_ACCOUNTS[role];
    try {
      sessionStorage.setItem(SESSION_KEY, role);
      sessionStorage.setItem(USER_KEY, JSON.stringify(preset));
    } catch {
      // ignore storage errors
    }
    set({ isAuthenticated: true, currentUser: preset });

    // Gọi API lấy JWT thật từ MongoDB ở nền
    authApi
      .demoLogin(role)
      .then((res) => {
        if (res?.token) setAuthToken(res.token);
        if (res?.user) {
          try {
            sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
          } catch {}
          set({ isAuthenticated: true, currentUser: res.user });
        }
      })
      .catch(() => {
        // Fallback offline vẫn giữ phiên demo
      });
  },

  loginWithCredentials: async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    setAuthToken(res.token);
    try {
      sessionStorage.setItem(SESSION_KEY, res.user.role);
      sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {}
    set({ isAuthenticated: true, currentUser: res.user });
    return res.user as UserProfile;
  },

  registerCitizen: async (payload) => {
    const res = await authApi.register(payload);
    setAuthToken(res.token);
    try {
      sessionStorage.setItem(SESSION_KEY, res.user.role);
      sessionStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {}
    set({ isAuthenticated: true, currentUser: res.user });
    return res.user as UserProfile;
  },

  logout: () => {
    setAuthToken(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {}
    set({ isAuthenticated: false, currentUser: PRESET_ACCOUNTS.citizen });
  },
}));

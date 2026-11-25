import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Users,
  LogOut,
  LucideIcon,
  Send,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  roles: string[];
}

export interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'monitoring',
    title: 'ĐIỀU HÀNH & GIÁM SÁT',
    items: [
      {
        id: 'dashboard',
        label: '01. Bảng Điều Hành IOC',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'officer', 'leader', 'staff'],
      },
      {
        id: 'map',
        label: 'Bản Đồ Số Hiện Trường',
        path: '/map',
        icon: MapPin,
        roles: ['admin', 'officer', 'leader', 'staff'],
      },
    ],
  },
  {
    id: 'dispatch',
    title: 'TIẾP NHẬN & ĐIỀU PHỐI',
    items: [
      {
        id: 'inbox',
        label: '04. Hồ Sơ Chờ Phân Công',
        path: '/inbox',
        icon: ClipboardList,
        badge: '3 khẩn',
        roles: ['admin', 'officer', 'leader', 'staff'],
      },
      {
        id: 'field',
        label: '05. Nghiệm Thu Before-After',
        path: '/field/tasks',
        icon: Users,
        roles: ['admin', 'officer', 'leader', 'staff'],
      },
    ],
  },
  {
    id: 'switch_portal',
    title: 'CỔNG DỊCH VỤ DÂN SINH',
    items: [
      {
        id: 'citizen-portal',
        label: '👤 Cổng Người Dân (Top Bar)',
        path: '/citizen/home',
        icon: Send,
        roles: ['admin', 'officer', 'leader', 'staff', 'citizen'],
      },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'login',
    label: 'Đổi Tài Khoản / Đăng Xuất',
    path: '/login',
    icon: LogOut,
    roles: ['admin', 'officer', 'leader', 'staff', 'volunteer', 'citizen'],
  },
];

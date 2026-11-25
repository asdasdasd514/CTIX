import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, type UserRoleType } from '../models/User';
import { signToken, type AuthRequest } from '../middlewares/auth';

function serializeUser(u: {
  userId: string;
  name: string;
  title: string;
  role: UserRoleType;
  department: string;
  unitId?: string;
  phone: string;
  isActive?: boolean;
}) {
  return {
    id: u.userId,
    name: u.name,
    title: u.title,
    role: u.role,
    department: u.department,
    unitId: u.unitId,
    phone: u.phone,
    isActive: u.isActive ?? true,
  };
}

// POST /api/auth/register — Đăng ký tài khoản Công dân chỉ qua SĐT + Mật khẩu
export async function register(req: Request, res: Response) {
  try {
    const { name, phone, password, confirmPassword } = req.body as {
      name?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    };

    const cleanPhone = (phone || '').replace(/[\s.-]/g, '').trim();
    if (!cleanPhone || !/^0\d{8,10}$/.test(cleanPhone)) {
      return res.status(400).json({
        message: 'Số điện thoại không hợp lệ (ví dụ: 0912345678).',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có tối thiểu 6 ký tự.',
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        message: 'Mật khẩu xác nhận không khớp.',
      });
    }

    const existing = await UserModel.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(409).json({
        message: 'Số điện thoại này đã được đăng ký.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      userId: `u-${Date.now().toString(36)}`,
      name: name?.trim() || `Công dân ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      passwordHash,
      role: 'citizen',
      title: 'Công dân Đồng Nai',
      department: 'Đồng Nai',
      isActive: true,
    });

    const token = signToken({
      userId: user.userId,
      name: user.name,
      role: user.role,
      phone: user.phone,
    });

    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] register error:', err);
    return res.status(500).json({ message: 'Không thể đăng ký tài khoản lúc này.' });
  }
}

// POST /api/auth/login — Đăng nhập qua Số điện thoại + Mật khẩu (phân quyền tự động)
export async function login(req: Request, res: Response) {
  try {
    const { identifier, phone, password } = req.body as {
      identifier?: string;
      phone?: string;
      password?: string;
    };
    const rawKey = (phone || identifier || '').trim();
    if (!rawKey || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu.' });
    }

    const normalizedPhone = rawKey.replace(/[\s.-]/g, '');
    const user = await UserModel.findOne({
      $or: [{ phone: rawKey }, { phone: normalizedPhone }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ UBND Đồng Nai.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
    }

    const token = signToken({
      userId: user.userId,
      name: user.name,
      role: user.role,
      phone: user.phone,
    });

    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] login error:', err);
    return res.status(500).json({ message: 'Lỗi đăng nhập hệ thống.' });
  }
}

// POST /api/auth/demo-login
export async function demoLogin(req: Request, res: Response) {
  try {
    const role = (req.body?.role || 'citizen') as UserRoleType;
    const user = await UserModel.findOne({ role, isActive: true });
    if (!user) {
      return res.status(404).json({
        message: 'Chưa có tài khoản mẫu trong cơ sở dữ liệu. Hãy chạy npm run seed.',
      });
    }

    const token = signToken({
      userId: user.userId,
      name: user.name,
      role: user.role,
      phone: user.phone,
    });

    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] demoLogin error:', err);
    return res.status(500).json({ message: 'Không thể đăng nhập nhanh lúc này.' });
  }
}

// GET /api/auth/me
export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa đăng nhập.' });
    }
    const user = await UserModel.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    return res.json({ user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] getMe error:', err);
    return res.status(500).json({ message: 'Lỗi kiểm tra phiên đăng nhập.' });
  }
}

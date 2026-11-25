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
  phone: string;
  email: string;
}) {
  return {
    id: u.userId,
    name: u.name,
    title: u.title,
    role: u.role,
    department: u.department,
    phone: u.phone,
    email: u.email,
  };
}

export async function register(req: Request, res: Response) {
  try {
    const { name, phone, email, password } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ họ tên, SĐT, email và mật khẩu tối thiểu 6 ký tự.',
      });
    }

    const existing = await UserModel.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    });
    if (existing) {
      return res.status(409).json({ message: 'Email hoặc số điện thoại đã được đăng ký.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      userId: `u-${Date.now().toString(36)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'citizen',
      title: 'Công dân Phường Trấn Biên',
      department: 'Phường Trấn Biên, TP. Biên Hòa',
    });

    const token = signToken({
      userId: user.userId,
      name: user.name,
      role: user.role,
      email: user.email,
    });

    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] register error:', err);
    return res.status(500).json({ message: 'Không thể đăng ký tài khoản lúc này.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { identifier, email, phone, password } = req.body as {
      identifier?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    const key = (identifier || email || phone || '').trim();
    if (!key || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    const user = await UserModel.findOne({
      $or: [{ email: key.toLowerCase() }, { phone: key }],
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const token = signToken({
      userId: user.userId,
      name: user.name,
      role: user.role,
      email: user.email,
    });

    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] login error:', err);
    return res.status(500).json({ message: 'Lỗi đăng nhập hệ thống.' });
  }
}

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
      email: user.email,
    });

    return res.json({ token, user: serializeUser(user) });
  } catch (err) {
    console.error('[Auth] demoLogin error:', err);
    return res.status(500).json({ message: 'Không thể đăng nhập nhanh lúc này.' });
  }
}

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

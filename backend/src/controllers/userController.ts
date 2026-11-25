import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, type IUser, type UserRoleType } from '../models/User';
import { UnitModel } from '../models/Unit';
import { UnitMemberModel } from '../models/UnitMember';

const STAFF_ROLES: UserRoleType[] = ['officer', 'leader', 'volunteer'];

function isStaffRole(role: UserRoleType): boolean {
  return STAFF_ROLES.includes(role);
}

function defaultTitleByRole(role: UserRoleType): string {
  if (role === 'officer') return 'Quản trị viên / Cán bộ điều phối';
  if (role === 'leader') return 'Cán bộ Điều hành';
  if (role === 'volunteer') return 'Đội xử lý hiện trường';
  return 'Công dân Phường Trấn Biên';
}

function serializeAccount(u: IUser) {
  return {
    id: u.userId,
    name: u.name,
    title: u.title,
    role: u.role,
    department: u.department,
    unitId: u.unitId || '',
    phone: u.phone,
    email: u.email || '',
    isActive: u.isActive,
    createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
  };
}

// Đồng bộ tài khoản Admin / Đội xử lý sang collection UnitMember để hiển thị bên trang Thành viên
async function syncUserToTeamMember(user: IUser) {
  const memberId = `acc-${user.userId}`;
  if (isStaffRole(user.role)) {
    let targetUnitId = user.unitId;
    if (!targetUnitId) {
      const fallbackUnit = await UnitModel.findOne({ unitId: 'unit-other' }) || (await UnitModel.findOne());
      targetUnitId = fallbackUnit?.unitId || 'unit-other';
    }

    await UnitMemberModel.findOneAndUpdate(
      { memberId },
      {
        $set: {
          memberId,
          name: user.name,
          role: user.title || defaultTitleByRole(user.role),
          phone: user.phone,
          unitId: targetUnitId,
          status: user.isActive ? 'available' : 'off_duty',
        },
      },
      { upsert: true, new: true }
    );
  } else {
    // Nếu hạ quyền về Công dân thì gỡ khỏi danh sách Thành viên đội xử lý
    await UnitMemberModel.deleteOne({ memberId });
  }
}

// GET /api/users — Lấy toàn bộ tài khoản
export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await UserModel.find().sort({ createdAt: -1 });
    return res.json({ users: users.map(serializeAccount) });
  } catch (err) {
    console.error('[Users] listUsers error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách tài khoản.' });
  }
}

// POST /api/users — Admin tạo tài khoản mới (tự đồng bộ sang Thành viên nếu là Admin hoặc Đội xử lý)
export async function createUser(req: Request, res: Response) {
  try {
    const { name, phone, email, password, role, title, department, unitId } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      role?: UserRoleType;
      title?: string;
      department?: string;
      unitId?: string;
    };

    const cleanPhone = (phone || '').replace(/[\s.-]/g, '').trim();
    if (!name?.trim() || !cleanPhone) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ họ tên và số điện thoại.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 6 ký tự.' });
    }

    const cleanEmail = email?.trim().toLowerCase() || undefined;
    const orQuery: Record<string, unknown>[] = [{ phone: cleanPhone }];
    if (cleanEmail) orQuery.push({ email: cleanEmail });

    const exists = await UserModel.findOne({ $or: orQuery });
    if (exists) {
      return res.status(409).json({ message: 'Số điện thoại hoặc email đã tồn tại trong hệ thống.' });
    }

    const finalRole: UserRoleType = role || 'citizen';
    const passwordHash = await bcrypt.hash(password, 10);

    let resolvedDepartment = department?.trim() || 'UBND Phường Trấn Biên';
    if (unitId && isStaffRole(finalRole)) {
      const unit = await UnitModel.findOne({ unitId });
      if (unit) resolvedDepartment = unit.name;
    }

    const user = await UserModel.create({
      userId: `u-${Date.now().toString(36)}`,
      name: name.trim(),
      phone: cleanPhone,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      passwordHash,
      role: finalRole,
      title: title?.trim() || defaultTitleByRole(finalRole),
      department: finalRole === 'citizen' ? 'Phường Trấn Biên, TP. Biên Hòa' : resolvedDepartment,
      unitId: isStaffRole(finalRole) ? unitId || 'unit-other' : undefined,
      isActive: true,
    });

    // Tự động thêm sang trang Thành viên nếu là Admin hoặc Đội xử lý
    await syncUserToTeamMember(user);

    return res.status(201).json({ user: serializeAccount(user) });
  } catch (err) {
    console.error('[Users] createUser error:', err);
    return res.status(500).json({ message: 'Không thể tạo tài khoản mới.' });
  }
}

// PATCH /api/users/:id — Cập nhật thông tin, vai trò, mật khẩu hoặc khóa/mở khóa
export async function updateUser(req: Request, res: Response) {
  try {
    const user = await UserModel.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    const { name, phone, email, password, role, title, department, unitId, isActive } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
      role?: UserRoleType;
      title?: string;
      department?: string;
      unitId?: string;
      isActive?: boolean;
    };

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (phone !== undefined && phone.trim()) user.phone = phone.replace(/[\s.-]/g, '').trim();
    if (email !== undefined) user.email = email.trim() ? email.trim().toLowerCase() : undefined;
    if (role !== undefined) user.role = role;
    if (title !== undefined) user.title = title.trim() || defaultTitleByRole(user.role);
    if (department !== undefined) user.department = department.trim();
    if (unitId !== undefined) user.unitId = isStaffRole(user.role) ? unitId || 'unit-other' : undefined;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (password && password.length >= 6) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    await syncUserToTeamMember(user);

    return res.json({ user: serializeAccount(user) });
  } catch (err) {
    console.error('[Users] updateUser error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật tài khoản.' });
  }
}

// DELETE /api/users/:id — Xóa tài khoản (và gỡ khỏi Thành viên nếu có)
export async function deleteUser(req: Request, res: Response) {
  try {
    const user = await UserModel.findOne({ userId: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    await UserModel.deleteOne({ _id: user._id });
    await UnitMemberModel.deleteOne({ memberId: `acc-${user.userId}` });
    return res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[Users] deleteUser error:', err);
    return res.status(500).json({ message: 'Không thể xóa tài khoản.' });
  }
}

import type { Request, Response } from 'express';
import { UnitModel } from '../models/Unit';
import { UnitMemberModel } from '../models/UnitMember';

export async function getTeams(_req: Request, res: Response) {
  try {
    const [units, members] = await Promise.all([
      UnitModel.find().sort({ createdAt: 1 }),
      UnitMemberModel.find().sort({ createdAt: 1 }),
    ]);

    return res.json({
      units: units.map((u) => ({
        id: u.unitId,
        name: u.name,
        category: u.category,
        description: u.description,
        hotline: u.hotline,
      })),
      members: members.map((m) => ({
        id: m.memberId,
        name: m.name,
        role: m.role,
        phone: m.phone,
        unitId: m.unitId,
        status: m.status,
      })),
    });
  } catch (err) {
    console.error('[Teams] getTeams error:', err);
    return res.status(500).json({ message: 'Không thể tải danh sách tổ đội và thành viên.' });
  }
}

export async function createUnit(req: Request, res: Response) {
  try {
    const { name, category, description, hotline } = req.body;
    if (!name?.trim() || !category) {
      return res.status(400).json({ message: 'Vui lòng nhập tên tổ đội và lĩnh vực phụ trách.' });
    }
    const unit = await UnitModel.create({
      unitId: `unit-${Date.now().toString(36)}`,
      name: name.trim(),
      category,
      description: description?.trim() || 'Tổ đội tiếp ứng xử lý sự cố hạ tầng đô thị.',
      hotline: hotline?.trim() || '0251.382.1100',
    });
    return res.status(201).json({
      unit: {
        id: unit.unitId,
        name: unit.name,
        category: unit.category,
        description: unit.description,
        hotline: unit.hotline,
      },
    });
  } catch (err) {
    console.error('[Teams] createUnit error:', err);
    return res.status(500).json({ message: 'Không thể tạo tổ đội mới.' });
  }
}

export async function updateUnit(req: Request, res: Response) {
  try {
    const unit = await UnitModel.findOneAndUpdate(
      { unitId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!unit) return res.status(404).json({ message: 'Không tìm thấy tổ đội.' });
    return res.json({
      unit: {
        id: unit.unitId,
        name: unit.name,
        category: unit.category,
        description: unit.description,
        hotline: unit.hotline,
      },
    });
  } catch (err) {
    console.error('[Teams] updateUnit error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật tổ đội.' });
  }
}

export async function deleteUnit(req: Request, res: Response) {
  try {
    await UnitModel.deleteOne({ unitId: req.params.id });
    await UnitMemberModel.deleteMany({ unitId: req.params.id });
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[Teams] deleteUnit error:', err);
    return res.status(500).json({ message: 'Không thể xóa tổ đội.' });
  }
}

export async function createMember(req: Request, res: Response) {
  try {
    const { name, role, phone, unitId, status } = req.body;
    if (!name?.trim() || !unitId) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên và chọn tổ đội.' });
    }
    const member = await UnitMemberModel.create({
      memberId: `staff-${Date.now().toString(36)}`,
      name: name.trim(),
      role: role?.trim() || 'Tổ viên hiện trường',
      phone: phone?.trim() || 'Chưa cập nhật',
      unitId,
      status: status || 'available',
    });
    return res.status(201).json({
      member: {
        id: member.memberId,
        name: member.name,
        role: member.role,
        phone: member.phone,
        unitId: member.unitId,
        status: member.status,
      },
    });
  } catch (err) {
    console.error('[Teams] createMember error:', err);
    return res.status(500).json({ message: 'Không thể thêm thành viên.' });
  }
}

export async function updateMember(req: Request, res: Response) {
  try {
    const member = await UnitMemberModel.findOneAndUpdate(
      { memberId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'Không tìm thấy thành viên.' });
    return res.json({
      member: {
        id: member.memberId,
        name: member.name,
        role: member.role,
        phone: member.phone,
        unitId: member.unitId,
        status: member.status,
      },
    });
  } catch (err) {
    console.error('[Teams] updateMember error:', err);
    return res.status(500).json({ message: 'Không thể cập nhật thành viên.' });
  }
}

export async function deleteMember(req: Request, res: Response) {
  try {
    await UnitMemberModel.deleteOne({ memberId: req.params.id });
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[Teams] deleteMember error:', err);
    return res.status(500).json({ message: 'Không thể xóa thành viên.' });
  }
}

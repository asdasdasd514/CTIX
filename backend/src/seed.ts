import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/db';
import { UserModel } from './models/User';
import { UnitModel, type IncidentCategoryType } from './models/Unit';
import { UnitMemberModel } from './models/UnitMember';
import { IncidentModel, type IncidentStatusType } from './models/Incident';

const STREET_NAMES = [
  'Đường Nguyễn Ái Quốc',
  'Đường Cách Mạng Tháng 8',
  'Đường Huỳnh Văn Nghệ',
  'Đường Đồng Khởi',
  'Hẻm 42 Nguyễn Ái Quốc',
  'Khu phố 1, Phường Trấn Biên',
  'Khu phố 2, Phường Trấn Biên',
  'Khu phố 3, Phường Trấn Biên',
  'Khu phố 4, Phường Trấn Biên',
  'Đường Phan Chu Trinh',
  'Khu dân cư Trấn Biên Plaza',
  'Gần Trường Tiểu học Trấn Biên',
  'Đoạn gần Chợ Trấn Biên',
  'Gần Công viên Bờ sông Trấn Biên',
];

const SAMPLE_PHOTOS: Record<IncidentCategoryType | 'resolved', string[]> = {
  street_light: [
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=60',
  ],
  flooding: [
    'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=500&auto=format&fit=crop&q=60',
  ],
  waste: [
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=500&auto=format&fit=crop&q=60',
  ],
  road_damage: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=500&auto=format&fit=crop&q=60',
  ],
  other: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60',
  ],
  resolved: [
    'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60',
  ],
};

async function seed() {
  await connectDatabase();

  // 1. Seed Users (Mật khẩu mặc định: 123456, đăng nhập bằng SĐT)
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    {
      userId: 'u-long',
      name: 'Nguyễn Thành Long',
      title: 'Cán bộ Quản trị & Điều phối',
      role: 'officer' as const,
      department: 'UBND Phường Trấn Biên',
      phone: '0912888999',
      passwordHash,
    },
    {
      userId: 'u-minh',
      name: 'Trần Văn Minh',
      title: 'Cán bộ Điều hành Chủ Trì (IOC)',
      role: 'leader' as const,
      department: 'Trung tâm IOC Tỉnh Đồng Nai',
      phone: '0903111222',
      passwordHash,
    },
    {
      userId: 'u-nam',
      name: 'Lê Hoàng Nam',
      title: 'Đội trưởng Thanh niên Tình nguyện',
      role: 'volunteer' as const,
      department: 'Đoàn Thanh niên Phường Trấn Biên',
      phone: '0977333444',
      passwordHash,
    },
    {
      userId: 'u-dan',
      name: 'Bác Hai Trấn Biên',
      title: 'Công dân Phường Trấn Biên',
      role: 'citizen' as const,
      department: 'Khu phố 2, Phường Trấn Biên',
      phone: '0988555666',
      passwordHash,
    },
  ];

  await UserModel.deleteMany({});
  await UserModel.insertMany(users);
  console.log(`[Seed] Seeded ${users.length} users.`);

  // 2. Seed Units & Members
  const units = [
    {
      unitId: 'unit-light',
      name: 'Tổ bảo trì chiếu sáng',
      category: 'street_light' as const,
      description: 'Kiểm tra, sửa chữa hệ thống đèn chiếu sáng công cộng và tủ điện đường phố.',
      hotline: '0251.382.1101',
    },
    {
      unitId: 'unit-flood',
      name: 'Tổ thoát nước',
      category: 'flooding' as const,
      description: 'Khơi thông cống rãnh, xử lý điểm ngập cục bộ và nắp hố ga trên địa bàn phường.',
      hotline: '0251.382.1102',
    },
    {
      unitId: 'unit-waste',
      name: 'Tổ vệ sinh môi trường',
      category: 'waste' as const,
      description: 'Thu gom rác tồn lưu, xử lý điểm tập kết rác tự phát và giữ vệ sinh đô thị.',
      hotline: '0251.382.1103',
    },
    {
      unitId: 'unit-road',
      name: 'Tổ bảo trì đường bộ',
      category: 'road_damage' as const,
      description: 'Duy tu mặt đường, vá ổ gà, chỉnh trang vỉa hè và biển báo giao thông.',
      hotline: '0251.382.1104',
    },
    {
      unitId: 'unit-other',
      name: 'Tổ xử lý sự cố tổng hợp',
      category: 'other' as const,
      description: 'Tiếp ứng nhanh các sự cố hạ tầng phát sinh và phối hợp liên ngành.',
      hotline: '0251.382.1105',
    },
  ];

  const members = [
    { memberId: 'staff-hung', name: 'Nguyễn Văn Hùng', role: 'Kỹ thuật chiếu sáng', phone: '0912.839.888', unitId: 'unit-light', status: 'available' as const },
    { memberId: 'staff-bao', name: 'Trần Quốc Bảo', role: 'Tổ viên chiếu sáng', phone: '0908.411.233', unitId: 'unit-light', status: 'available' as const },
    { memberId: 'staff-tuan', name: 'Phạm Minh Tuấn', role: 'Tổ trưởng thoát nước', phone: '0918.552.190', unitId: 'unit-flood', status: 'available' as const },
    { memberId: 'staff-son', name: 'Lê Văn Sơn', role: 'Kỹ thuật thoát nước', phone: '0977.304.889', unitId: 'unit-flood', status: 'available' as const },
    { memberId: 'staff-lan', name: 'Đỗ Thị Lan', role: 'Tổ trưởng vệ sinh', phone: '0909.612.445', unitId: 'unit-waste', status: 'available' as const },
    { memberId: 'staff-phuc', name: 'Võ Hoàng Phúc', role: 'Nhân viên môi trường', phone: '0933.210.774', unitId: 'unit-waste', status: 'available' as const },
    { memberId: 'staff-danh', name: 'Huỳnh Công Danh', role: 'Kỹ thuật đường bộ', phone: '0914.782.331', unitId: 'unit-road', status: 'available' as const },
    { memberId: 'staff-thang', name: 'Bùi Đức Thắng', role: 'Tổ viên duy tu', phone: '0968.119.502', unitId: 'unit-road', status: 'available' as const },
    { memberId: 'staff-nghia', name: 'Nguyễn Hữu Nghĩa', role: 'Cán bộ điều phối tổng hợp', phone: '0903.448.920', unitId: 'unit-other', status: 'available' as const },
    { memberId: 'staff-hoa', name: 'Lê Minh Hòa', role: 'Tổ viên phản ứng nhanh', phone: '0982.615.308', unitId: 'unit-other', status: 'available' as const },
  ];

  await UnitModel.deleteMany({});
  await UnitModel.insertMany(units);
  await UnitMemberModel.deleteMany({});
  await UnitMemberModel.insertMany(members);
  console.log(`[Seed] Seeded ${units.length} units and ${members.length} members.`);

  // 3. Seed 64 Incidents (Phường Trấn Biên tháng 11/2026)
  const targets: { category: IncidentCategoryType; count: number; resolvedCount: number }[] = [
    { category: 'street_light', count: 18, resolvedCount: 13 },
    { category: 'flooding', count: 15, resolvedCount: 11 },
    { category: 'waste', count: 21, resolvedCount: 16 },
    { category: 'road_damage', count: 10, resolvedCount: 7 },
  ];

  let idCounter = 1;
  const baseLat = 10.9572;
  const baseLng = 106.8243;
  const docs = [];

  for (const target of targets) {
    for (let i = 0; i < target.count; i++) {
      const isResolved = i < target.resolvedCount;
      const dayOfMonth = Math.max(1, Math.min(25, ((idCounter * 3) % 24) + 1));
      const hour = (idCounter * 7) % 14 + 7;
      const minute = (idCounter * 13) % 59;

      const createdDate = new Date(2026, 10, dayOfMonth, hour, minute);
      const createdAtIso = createdDate.toISOString();

      let status: IncidentStatusType = 'pending';
      if (isResolved) {
        status = i % 3 === 0 ? 'resolved' : 'closed';
      } else {
        const rem = i - target.resolvedCount;
        if (rem % 3 === 0) status = 'pending';
        else if (rem % 3 === 1) status = 'assigned';
        else status = 'in_progress';
      }

      const street = STREET_NAMES[idCounter % STREET_NAMES.length];
      const houseNum = ((idCounter * 7) % 180) + 1;
      const address = `${houseNum} ${street}, P. Trấn Biên`;
      const latOffset = (((idCounter * 17) % 100) - 50) * 0.00018;
      const lngOffset = (((idCounter * 23) % 100) - 50) * 0.00018;
      const lat = Number((baseLat + latOffset).toFixed(6));
      const lng = Number((baseLng + lngOffset).toFixed(6));

      let title = '';
      let description = '';
      let unitName = '';
      if (target.category === 'street_light') {
        title = `Đèn chiếu sáng chập chờn / mất nguồn tại ${street}`;
        description = `Bóng đèn cao áp tại cột số ${idCounter + 1} bị tắt hẳn nhiều ngày qua gây mất an toàn giao thông và an ninh khu dân cư ban đêm.`;
        unitName = 'Tổ bảo trì chiếu sáng';
      } else if (target.category === 'flooding') {
        title = `Ngập cục bộ sau cơn mưa lớn đoạn ${street}`;
        description = `Nước mưa ứ đọng sâu khoảng 25-40cm, miệng cống thoát nước bị nghẹt rác khiến nước rút rất chậm, xe máy chết máy liên tục.`;
        unitName = 'Tổ thoát nước';
      } else if (target.category === 'waste') {
        title = `Điểm tập kết rác thải tự phát bốc mùi hôi tại ${street}`;
        description = `Có người lén đổ rác sinh hoạt, phế thải xây dựng ngay vỉa hè bốc mùi khó chịu, gây mất mỹ quan đô thị và ô nhiễm môi trường.`;
        unitName = 'Tổ vệ sinh môi trường';
      } else {
        title = `Mặt đường xuất hiện ổ gà sâu nguy hiểm tại ${street}`;
        description = `Lớp nhựa bị bong tróc tạo hố rộng gần 1m, sâu khoảng 15cm, đã có người đi xe máy bị sụp ổ gà loạng choạng suýt ngã.`;
        unitName = 'Tổ bảo trì đường bộ';
      }

      const senderNames = [
        'Bác Hai Trấn Biên',
        'Chú Tư Khu phố 2',
        'Chị Lan Anh',
        'Anh Minh Hoàng',
        'Cô Hoa Trấn Biên',
        'Anh Tuấn Kiệt',
        'Chị Thanh Thảo',
      ];
      const sender = {
        name: senderNames[idCounter % senderNames.length],
        phone: `09${String(10000000 + idCounter * 13791).slice(0, 8)}`,
      };

      const priority =
        idCounter % 7 === 0 ? 'urgent' : idCounter % 3 === 0 ? 'high' : 'normal';
      const photosBefore = [
        SAMPLE_PHOTOS[target.category][idCounter % SAMPLE_PHOTOS[target.category].length],
      ];

      let assignedTo;
      let resolution;
      let rating;
      let photosAfter: string[] = [];
      let updatedAtIso = createdAtIso;

      if (status !== 'pending') {
        const assignedDate = new Date(createdDate.getTime() + 4 * 60 * 60 * 1000);
        const deadlineDate = new Date(createdDate.getTime() + 4 * 24 * 60 * 60 * 1000);
        assignedTo = {
          unitName,
          officerName: 'Nguyễn Thành Long',
          assignedAt: assignedDate.toISOString(),
          deadline: deadlineDate.toISOString(),
          notes: 'Ưu tiên kiểm tra hiện trường và xử lý triệt để theo đúng cam kết SLA.',
        };
        updatedAtIso = assignedDate.toISOString();
      }

      if (status === 'resolved' || status === 'closed') {
        const resolvedDate = new Date(createdDate.getTime() + 3.2 * 24 * 60 * 60 * 1000);
        resolution = {
          notes: 'Đội kỹ thuật đã hoàn tất khắc phục triệt để tại hiện trường, vệ sinh sạch sẽ và kiểm tra an toàn.',
          resolvedAt: resolvedDate.toISOString(),
          officerName: 'Nguyễn Thành Long',
        };
        photosAfter = [SAMPLE_PHOTOS.resolved[idCounter % SAMPLE_PHOTOS.resolved.length]];
        updatedAtIso = resolvedDate.toISOString();
      }

      if (status === 'closed') {
        const ratedDate = new Date(
          new Date(resolution!.resolvedAt).getTime() + 6 * 60 * 60 * 1000
        );
        rating = {
          stars: idCounter % 5 === 0 ? 4 : 5,
          comment: 'Chính quyền xử lý rất nhanh, sạch sẽ. Rất hoan nghênh!',
          criteria: ['Xử lý nhanh', 'Đúng vị trí', 'Thái độ tốt'],
          ratedAt: ratedDate.toISOString(),
        };
        updatedAtIso = ratedDate.toISOString();
      }

      docs.push({
        incidentId: `inc-${idCounter}`,
        code: `TB-2026-${String(idCounter).padStart(3, '0')}`,
        title,
        description,
        category: target.category,
        status,
        priority,
        location: {
          lat,
          lng,
          address,
          ward: 'Phường Trấn Biên',
          geo: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        },
        sender,
        photosBefore,
        photosAfter,
        assignedTo,
        resolution,
        rating,
        sameReportsCount: idCounter % 5 === 0 ? 5 : idCounter % 3 === 0 ? 2 : 1,
        verifiedByVolunteer: status !== 'pending',
        createdAtIso,
        updatedAtIso,
      });

      idCounter++;
    }
  }

  await IncidentModel.deleteMany({});
  await IncidentModel.insertMany(docs);
  console.log(`[Seed] Seeded ${docs.length} incidents into MongoDB Atlas (ctix_smartcity).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});

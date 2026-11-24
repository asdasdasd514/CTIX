import { Incident, IncidentCategory, IncidentStatus } from '../types/incident';

// Danh sách đường phố thực tế tại Phường Trấn Biên (Biên Hòa, Đồng Nai)
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

const SAMPLE_PHOTOS = {
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

// Tạo 64 phản ánh chuẩn Phường Trấn Biên (tháng 11/2026)
// Đèn đường: 18, Ngập nước: 15, Rác thải: 21, Mặt đường: 10
// Tổng: 64, Đã xử lý: 47 (thời gian TB 3.2 ngày)
export function generateMockIncidents(): Incident[] {
  const incidents: Incident[] = [];

  const targets: { category: IncidentCategory; count: number; resolvedCount: number }[] = [
    { category: 'street_light', count: 18, resolvedCount: 13 },
    { category: 'flooding', count: 15, resolvedCount: 11 },
    { category: 'waste', count: 21, resolvedCount: 16 },
    { category: 'road_damage', count: 10, resolvedCount: 7 },
  ];

  let idCounter = 1;
  const baseLat = 10.9572;
  const baseLng = 106.8184;

  targets.forEach(({ category, count, resolvedCount }) => {
    for (let i = 0; i < count; i++) {
      const codeNumber = String(idCounter).padStart(3, '0');
      const isResolved = i < resolvedCount;
      let status: IncidentStatus = 'resolved';

      if (!isResolved) {
        const remainingIdx = i - resolvedCount;
        if (remainingIdx % 3 === 0) status = 'pending';
        else if (remainingIdx % 3 === 1) status = 'assigned';
        else status = 'in_progress';
      }

      // Tạo tọa độ quanh Phường Trấn Biên (trong bán kính ~1.5km)
      const latOffset = (Math.sin(idCounter * 12.3) * 0.012);
      const lngOffset = (Math.cos(idCounter * 7.9) * 0.014);

      const street = STREET_NAMES[idCounter % STREET_NAMES.length];
      const address = `${(idCounter * 7) % 180 + 1} ${street}, P. Trấn Biên`;

      let title = '';
      let desc = '';
      if (category === 'street_light') {
        title = `Đèn chiếu sáng chập chờn / mất nguồn tại ${street}`;
        desc = `Bóng đèn cao áp tại cột số ${(idCounter % 15) + 1} bị tắt hẳn nhiều ngày qua gây mất an toàn giao thông và an ninh khu dân cư ban đêm.`;
      } else if (category === 'flooding') {
        title = `Ngập cục bộ sau cơn mưa lớn đoạn ${street}`;
        desc = `Nước mưa ứ đọng sâu khoảng 25-40cm, miệng cống thoát nước bị nghẹt rác khiến nước rút rất chậm, xe máy chết máy liên tục.`;
      } else if (category === 'waste') {
        title = `Điểm tập kết rác thải tự phát bốc mùi hôi tại ${street}`;
        desc = `Có người lén đổ rác sinh hoạt, phế thải xây dựng ngay vỉa hè bốc mùi khó chịu, gây mất mỹ quan đô thị và ô nhiễm môi trường.`;
      } else {
        title = `Ổ gà, nứt lún mặt đường nguy hiểm tại ${street}`;
        desc = `Mặt đường xuất hiện ổ gà kích thước lớn sâu khoảng 10-15cm, mép sắc nhọn, người đi xe máy rất dễ trượt ngã vào ban đêm.`;
      }

      const createdDay = ((idCounter * 3) % 20) + 1;
      const createdDate = new Date(2026, 10, createdDay, 8 + (idCounter % 10), (idCounter * 17) % 60);

      // Thời gian xử lý trung bình: 3.2 ngày
      const resolutionDays = 2 + ((idCounter % 5) * 0.6); // dao động 2.0 - 4.4 ngày, TB ~ 3.2 ngày
      const resolvedDate = new Date(createdDate.getTime() + resolutionDays * 24 * 60 * 60 * 1000);

      const beforePhoto = SAMPLE_PHOTOS[category][idCounter % SAMPLE_PHOTOS[category].length];
      const afterPhoto = SAMPLE_PHOTOS.resolved[idCounter % SAMPLE_PHOTOS.resolved.length];

      const item: Incident = {
        id: `inc-${idCounter}`,
        code: `TB-2026-${codeNumber}`,
        title,
        description: desc,
        category,
        status,
        priority: idCounter % 7 === 0 ? 'urgent' : idCounter % 3 === 0 ? 'high' : 'normal',
        location: {
          lat: Number((baseLat + latOffset).toFixed(6)),
          lng: Number((baseLng + lngOffset).toFixed(6)),
          address,
        },
        sender: {
          name: ['Bác Ba', 'Chú Tám', 'Nguyễn Văn An', 'Trần Thị Mai', 'Cô Hoa Trấn Biên'][idCounter % 5],
          phone: `09${(idCounter * 13789) % 90000000 + 10000000}`,
        },
        photosBefore: [beforePhoto],
        sameReportsCount: (idCounter % 4 === 0) ? (idCounter % 5) + 1 : 1,
        verifiedByVolunteer: idCounter % 2 === 0,
        createdAt: createdDate.toISOString(),
        updatedAt: isResolved ? resolvedDate.toISOString() : createdDate.toISOString(),
      };

      if (status !== 'pending') {
        const units = [
          'Đội Trật tự Đô thị Phường',
          'Công ty Chiếu sáng Đô thị',
          'Công ty Cấp thoát nước Trấn Biên',
          'Đội Thanh niên Tình nguyện Phường',
        ];
        const assignedUnit = category === 'street_light' ? units[1]
          : category === 'flooding' ? units[2]
          : category === 'waste' ? units[0]
          : units[0];

        item.assignedTo = {
          unitName: assignedUnit,
          officerName: 'Cán bộ Nguyễn Hữu Nghĩa',
          assignedAt: new Date(createdDate.getTime() + 2 * 3600 * 1000).toISOString(),
          deadline: new Date(createdDate.getTime() + 4 * 24 * 3600 * 1000).toISOString(),
        };
      }

      if (isResolved) {
        item.photosAfter = [afterPhoto];
        item.resolution = {
          notes: `Đã phối hợp xử lý xong triệt để tại hiện trường vào ngày ${resolvedDate.toLocaleDateString('vi-VN')}. Hoàn trả mặt bằng thông thoáng.`,
          resolvedAt: resolvedDate.toISOString(),
          officerName: 'Tổ cơ động Phường Trấn Biên',
        };

        const stars = 4 + (idCounter % 2); // 4 hoặc 5 sao
        item.rating = {
          stars,
          comment: stars === 5 ? 'Chính quyền xử lý rất nhanh, sạch sẽ. Rất hoan nghênh!' : 'Đã sửa xong, đi lại an toàn hơn trước.',
          criteria: ['Xử lý đúng hạn', 'Hiện trường sạch sẽ'],
          ratedAt: new Date(resolvedDate.getTime() + 6 * 3600 * 1000).toISOString(),
        };
      }

      incidents.push(item);
      idCounter++;
    }
  });

  return incidents;
}

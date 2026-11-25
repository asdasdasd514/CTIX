import { env } from '../config/env';
import { IncidentModel } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';

export class AiServiceError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type AssistantAction =
  | 'create_report'
  | 'open_my_reports'
  | 'filter_reports'
  | 'open_camera'
  | 'navigate'
  | 'toggle_elderly'
  | 'scroll_page'
  | 'go_back'
  | 'call_hotline'
  | 'logout'
  | 'chat_reply';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantReportFilter {
  category?: IncidentCategoryType | 'all';
  status?: 'all' | 'pending' | 'resolved';
  searchQuery?: string;
  onlyMyReports?: boolean;
}

export interface AssistantResponse {
  action: AssistantAction;
  reply: string;
  transcript?: string;
  reportDraft?: {
    category: IncidentCategoryType;
    customCategoryName?: string;
    description: string;
  };
  reportFilter?: AssistantReportFilter;
  route?: string;
  openCamera?: boolean;
  elderlyEnabled?: boolean;
  scrollDirection?: 'top' | 'bottom';
  analyzedBy: 'gemini' | 'fallback';
}

const VALID_CATEGORIES: IncidentCategoryType[] = [
  'street_light',
  'flooding',
  'waste',
  'road_damage',
  'other',
];

const VALID_CITIZEN_ROUTES = [
  '/citizen/home',
  '/citizen/submit',
  '/citizen/reports',
  '/citizen/map',
  '/citizen/help',
  '/citizen/account',
  '/login',
  '/register',
];

function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategoryFallback(norm: string): IncidentCategoryType | null {
  if (/(den duong|chieu sang|bong den|cot dien|cot den|toi om|chap chon|chap tron)/.test(norm)) {
    return 'street_light';
  }
  if (/(ngap|cong|thoat nuoc|ho ga|nuoc u|lenh lang|tac cong)/.test(norm)) {
    return 'flooding';
  }
  if (/(rac|mui hoi|ve sinh|phe thai|bai rac)/.test(norm)) {
    return 'waste';
  }
  if (/(o ga|mat duong|sut lun|nhua duong|via he|nut duong)/.test(norm)) {
    return 'road_damage';
  }
  return null;
}

function looksLikeQuestion(norm: string): boolean {
  return /(\?|lam sao|nhu the nao|the nao|ra sao|la gi|bao lau|may ngay|quy trinh|co duoc khong|o dau|ban lam duoc gi|chuc nang|co the lam gi|huong dan|duoc xu ly|xe duoc xu ly|se duoc xu ly|tai sao|vi sao|khi nao|co mat phi|can dang nhap)/.test(
    norm
  );
}

/**
 * Bộ tri thức hỏi đáp thông minh (dùng khi người dùng hỏi thông tin mà Gemini tạm bận / chạm quota).
 * Phân biệt rạch ròi với lệnh điều khiển để không bao giờ trả lời lạc đề.
 */
function answerFaqFallback(norm: string): string | null {
  // 1. Quy trình xử lý phản ánh
  if (/(quy trinh|xu ly nhu the nao|duoc xu ly|xe duoc xu ly|se duoc xu ly|cac buoc|tien trinh)/.test(norm)) {
    return 'Phản ánh bạn gửi sẽ đi qua 4 bước: (1) UBND Phường Trấn Biên kiểm duyệt tiếp nhận trong vòng 2 giờ → (2) Phân công đội chuyên môn xử lý kèm quy trình từng bước → (3) Đội hiện trường khắc phục & tải ảnh nghiệm thu Trước – Sau → (4) Công dân kiểm tra và đánh giá 1–5 sao.';
  }

  // 2. Thời gian xử lý bao lâu / SLA
  if (/(bao lau|may ngay|may gio|thoi gian xu ly|sla|nhanh khong)/.test(norm)) {
    return 'UBND Phường tiếp nhận và duyệt phản ánh trong vòng 2 giờ. Thời gian khắc phục hiện trường thông thường từ 24–48 giờ (trung bình ~3,2 ngày tùy mức độ sự cố). Sự cố khẩn cấp có nhiều người đồng phản ánh sẽ được ưu tiên xử lý trước.';
  }

  // 3. Cách gửi phản ánh / có cần đăng nhập không
  if (/(cach gui|lam sao.*gui|can dang nhap|khong dang nhap|chua dang nhap)/.test(norm)) {
    return 'Bạn có thể gửi phản ánh ngay mà không cần đăng nhập: bấm "+ Thêm phản ánh", chụp/tải ảnh hiện trường, chọn loại sự cố, nhập mô tả (hoặc bấm micro để nói), điền Họ tên + SĐT và chọn vị trí trên bản đồ. Sau này nếu đăng ký tài khoản bằng đúng SĐT đó, toàn bộ bài đã gửi sẽ tự động đồng bộ về tài khoản.';
  }

  // 4. Chỉnh sửa / Hủy phản ánh
  if (/(chinh sua|sua phan anh|huy phan anh|xoa phan anh)/.test(norm)) {
    return 'Bạn chỉ có thể chỉnh sửa hoặc hủy phản ánh của chính mình khi hồ sơ đang ở trạng thái "Chờ duyệt" (trong mục Phản ánh của tôi). Khi UBND Phường đã duyệt tiếp nhận và chuyển sang xử lý, hồ sơ sẽ khóa chỉnh sửa để đảm bảo tính chính xác.';
  }

  // 5. Vì sao chưa hiện công khai / Chờ duyệt
  if (/(chua hien|khong thay|cho duyet|cong khai)/.test(norm)) {
    return 'Phản ánh mới gửi sẽ ở trạng thái "Chờ duyệt" và hiển thị ngay trong mục "Phản ánh của tôi" để chính bạn theo dõi hoặc chỉnh sửa. Sau khi Cán bộ Phường kiểm duyệt tiếp nhận, bài sẽ hiển thị công khai trên Trang chủ, Bản đồ và Danh sách toàn phường.';
  }

  // 6. Đồng phản ánh (+1) & gộp trùng
  if (/(dong phan anh|trung lap|gop phan anh|cong 1|\+1)/.test(norm)) {
    return 'Khi nhiều người cùng gặp 1 sự cố trong bán kính 50m, hệ thống tự động gợi ý "Đồng phản ánh (+1)" để gộp ảnh hiện trường và tăng mức độ ưu tiên, giúp UBND Phường điều phối xử lý nhanh hơn.';
  }

  // 7. Đánh giá sao & so sánh trước sau
  if (/(danh gia|cham diem|sao|truoc sau|nghiem thu)/.test(norm)) {
    return 'Khi sự cố được xử lý xong, bạn có thể kéo thanh trượt so sánh ảnh Trước – Sau ngay trên trang chi tiết hồ sơ và chấm điểm từ 1–5 sao cùng nhận xét về chất lượng phục vụ.';
  }

  // 8. Tổng đài / liên hệ khẩn cấp / địa chỉ UBND
  if (/(tong dai|1022|duong day nong|hotline|lien he|dia chi ubnd)/.test(norm)) {
    return 'Tổng đài hỗ trợ khẩn cấp 24/7 của Phường Trấn Biên là 1022. Địa chỉ trụ sở UBND Phường Trấn Biên: Số 128 Đường Nguyễn Ái Quốc, Khu phố 2, Phường Trấn Biên, TP. Biên Hòa, Đồng Nai.';
  }

  // 9. Hỏi AI làm được những gì
  if (/(ban lam duoc gi|co the lam gi|chuc nang|ho tro gi|lenh nao)/.test(norm)) {
    return 'Tôi vừa có thể giải đáp thông tin (quy trình xử lý, thời gian SLA, hướng dẫn gửi/sửa/hủy, tổng đài 1022) vừa thực hiện lệnh điều khiển trang: mở Trang chủ, Bản đồ, Phản ánh của tôi, lọc phản ánh, bật chữ lớn, mở Camera chụp ảnh hoặc tự điền phản ánh bằng giọng nói.';
  }

  return null;
}

function isMeaningfulIncidentDescription(text: string): boolean {
  const norm = normalizeVi(text)
    .replace(/^(toi muon|minh muon|cho toi|giup toi|hay|lam on)\s*/i, '')
    .replace(/^(gui|tao|mo|viet)?\s*(phan anh|bao cao|su co|moi)\s*/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
  return norm.length >= 6;
}

function fallbackAssistant(message: string): AssistantResponse {
  const norm = normalizeVi(message);

  // 1. Không làm gì nếu quá ngắn hoặc chỉ là tiếng đệm
  if (norm.length < 2 || /^(alo|a lo|um|uh|a|o|hi|hello|chao|xin chao)$/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Bạn có thể hỏi thông tin về quy trình xử lý phản ánh, hoặc ra lệnh mở trang, lọc phản ánh, bật chữ to, mở camera chụp ảnh và gửi phản ánh sự cố.',
      analyzedBy: 'fallback',
    };
  }

  // 1b. Ưu tiên trả lời HỎI ĐÁP THÔNG TIN trước khi xét lệnh điều khiển
  if (looksLikeQuestion(norm)) {
    const faq = answerFaqFallback(norm);
    if (faq) {
      return {
        action: 'chat_reply',
        reply: faq,
        analyzedBy: 'fallback',
      };
    }
  }

  // 2. Quay lại trang trước
  if (/^(quay lai|tro lai|tro ve trang truoc|lui lai)$/.test(norm)) {
    return {
      action: 'go_back',
      reply: 'Đang quay lại trang trước đó.',
      analyzedBy: 'fallback',
    };
  }

  // 3. Cuộn trang
  if (/(len dau trang|cuon len dau|keo len tren|dau trang)/.test(norm)) {
    return {
      action: 'scroll_page',
      scrollDirection: 'top',
      reply: 'Đã cuộn lên đầu trang.',
      analyzedBy: 'fallback',
    };
  }
  if (/(xuong cuoi trang|cuon xuong cuoi|keo xuong duoi|cuoi trang)/.test(norm)) {
    return {
      action: 'scroll_page',
      scrollDirection: 'bottom',
      reply: 'Đã cuộn xuống cuối trang.',
      analyzedBy: 'fallback',
    };
  }

  // 4. Đăng xuất
  if (/(dang xuat|thoat tai khoan|log out)/.test(norm)) {
    return {
      action: 'logout',
      reply: 'Đang đăng xuất tài khoản của bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 5. Chế độ người cao tuổi / chữ to
  if (/(nguoi cao tuoi|chu to|chu lon|tang co chu|giam co chu|chu nho)/.test(norm)) {
    const turnOff = /(tat|bo|huy|giam|nho)/.test(norm);
    return {
      action: 'toggle_elderly',
      elderlyEnabled: !turnOff,
      reply: turnOff
        ? 'Đã tắt chế độ chữ lớn.'
        : 'Đã bật chế độ Người cao tuổi với chữ lớn dễ đọc.',
      analyzedBy: 'fallback',
    };
  }

  // 6. Mở camera chụp ảnh phản ánh (hỗ trợ ĐA LỆNH: nếu vừa mô tả sự cố vừa đòi chụp ảnh -> create_report + openCamera: true)
  const wantsCamera = /(mo camera|chup anh|chup hinh|bat camera|bat may anh)/.test(norm);
  const wantsElderlyOn = /(bat|mo|tang).*(nguoi cao tuoi|chu to|chu lon|co chu)/.test(norm);
  const wantsElderlyOff = /(tat|bo|huy|giam).*(nguoi cao tuoi|chu to|chu lon|co chu)/.test(norm);
  const elderlyFlag = wantsElderlyOn ? true : wantsElderlyOff ? false : undefined;

  if (
    wantsCamera &&
    !looksLikeQuestion(norm) &&
    (/(phan anh|bao cao|gui su co|bao su co)/.test(norm) || inferCategoryFallback(norm) !== null) &&
    isMeaningfulIncidentDescription(
      message.replace(/(va\s*)?(mo camera|chup anh|chup hinh|bat camera|bat may anh|cac kieu|giup toi|luon|ngay)/gi, '')
    )
  ) {
    const category = inferCategoryFallback(norm) || 'other';
    const cleaned = message
      .replace(/^(tôi muốn|mình muốn|cho tôi|giúp tôi)\s*(gửi\s*)?(phản ánh|báo cáo)\s*/i, '')
      .replace(/(và\s*)?(tôi muốn\s*)?(mở camera|chụp ảnh|chụp hình|bật camera).*$/i, '')
      .trim();
    return {
      action: 'create_report',
      openCamera: true,
      elderlyEnabled: elderlyFlag,
      reply:
        'Đã điền sẵn thông tin phản ánh theo lời bạn nói và chuẩn bị sẵn nút mở Camera điện thoại để chụp ảnh ngay.',
      reportDraft: {
        category,
        description: cleaned || message.trim(),
      },
      route: '/citizen/submit',
      analyzedBy: 'fallback',
    };
  }

  if (wantsCamera) {
    return {
      action: 'open_camera',
      openCamera: true,
      elderlyEnabled: elderlyFlag,
      route: '/citizen/submit',
      reply: 'Đang mở trang tạo phản ánh và sẵn sàng mở Camera điện thoại cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 7. Gọi tổng đài 1022
  if (/(goi 1022|tong dai|duong day nong|hotline|so khan cap)/.test(norm)) {
    return {
      action: 'call_hotline',
      route: '/citizen/help',
      reply: 'Tổng đài hỗ trợ khẩn cấp 24/7 của Phường Trấn Biên là 1022. Đang mở trang liên hệ cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 8. Phản ánh của tôi
  if (/(phan anh cua toi|ho so cua toi|bai cua toi|xem phan anh cua toi|kiem tra phan anh cua toi)/.test(norm)) {
    return {
      action: 'open_my_reports',
      route: '/citizen/reports',
      reply: 'Đang mở mục Phản ánh của bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 9. Lọc / tìm kiếm phản ánh
  if (/(tim|loc|xem).*(phan anh|su co|ho so|da xu ly|dang xu ly|cho xu ly)/.test(norm)) {
    const cat = inferCategoryFallback(norm) || 'all';
    const status: 'all' | 'pending' | 'resolved' = /(da xu ly|hoan thanh|da xong)/.test(norm)
      ? 'resolved'
      : /(dang xu ly|cho xu ly|chua xu ly)/.test(norm)
      ? 'pending'
      : 'all';
    return {
      action: 'filter_reports',
      route: '/citizen/reports',
      reportFilter: { category: cat, status, onlyMyReports: false },
      reply: 'Đang mở danh sách phản ánh và lọc theo yêu cầu của bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 10. Điều hướng trang
  if (/(ban do|xem ban do|mo ban do|su co quanh day|gan day)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/map',
      reply: 'Đang mở Bản đồ phản ánh khu vực Phường Trấn Biên.',
      analyzedBy: 'fallback',
    };
  }
  if (/(tro giup|huong dan)/.test(norm) && !looksLikeQuestion(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/help',
      reply: 'Đang mở trang Trợ giúp & Hướng dẫn.',
      analyzedBy: 'fallback',
    };
  }
  if (/(tai khoan|ho so ca nhan|thong tin ca nhan)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/account',
      reply: 'Đang mở trang Tài khoản cá nhân.',
      analyzedBy: 'fallback',
    };
  }
  if (/(dang nhap|mo trang dang nhap)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/login',
      reply: 'Đang mở trang Đăng nhập.',
      analyzedBy: 'fallback',
    };
  }
  if (/(dang ky|tao tai khoan)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/register',
      reply: 'Đang mở trang Đăng ký tài khoản công dân.',
      analyzedBy: 'fallback',
    };
  }
  if (/(ve trang chu|mo trang chu|trang chu)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/home',
      reply: 'Đang đưa bạn về Trang chủ.',
      analyzedBy: 'fallback',
    };
  }
  if (/(danh sach phan anh|xem phan anh|tra cuu phan anh)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/reports',
      reply: 'Đang mở danh sách Phản ánh toàn phường.',
      analyzedBy: 'fallback',
    };
  }

  // 11. Chỉ yêu cầu MỞ TRANG tạo phản ánh (không kèm mô tả sự cố cụ thể) -> navigate form trắng
  if (/^(mo trang|mo|vao|toi muon|cho toi)?\s*(gui|tao)?\s*(phan anh|bao cao)( moi)?$/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/submit',
      reply: 'Đang mở trang Tạo phản ánh mới cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 12. Báo cáo sự cố CỤ THỂ (chỉ khi KHÔNG phải câu hỏi và có mô tả sự cố thực sự)
  if (
    !looksLikeQuestion(norm) &&
    (/(phan anh|bao cao|gui su co|bao su co)/.test(norm) || inferCategoryFallback(norm) !== null) &&
    isMeaningfulIncidentDescription(message)
  ) {
    const category = inferCategoryFallback(norm) || 'other';
    const cleaned = message
      .replace(/^(tôi muốn|mình muốn|cho tôi|giúp tôi)\s*(gửi\s*)?(phản ánh|báo cáo)\s*/i, '')
      .trim();
    return {
      action: 'create_report',
      reply:
        'Tôi đã mở trang gửi phản ánh và điền đúng mô tả của bạn. Hãy chụp ảnh hiện trường và chọn vị trí nhé.',
      reportDraft: {
        category,
        description: cleaned || message.trim(),
      },
      route: '/citizen/submit',
      analyzedBy: 'fallback',
    };
  }

  return {
    action: 'chat_reply',
    reply:
      'Tôi có thể giúp bạn: mở các trang (Trang chủ, Bản đồ, Phản ánh của tôi, Tạo phản ánh, Trợ giúp, Tài khoản), lọc phản ánh theo loại/trạng thái, bật chữ lớn, mở camera chụp ảnh, gọi 1022 hoặc gửi phản ánh bằng giọng nói.',
    analyzedBy: 'fallback',
  };
}

function sanitizeAssistantOutput(
  parsed: any,
  sourceText: string
): Omit<AssistantResponse, 'transcript' | 'analyzedBy'> {
  let action: AssistantAction = parsed.action || 'chat_reply';
  const validActions: AssistantAction[] = [
    'create_report',
    'open_my_reports',
    'filter_reports',
    'open_camera',
    'navigate',
    'toggle_elderly',
    'scroll_page',
    'go_back',
    'call_hotline',
    'logout',
    'chat_reply',
  ];
  if (!validActions.includes(action)) {
    action = 'chat_reply';
  }

  // Chống lỗi AI tự ý tạo phản ánh khi người dùng chỉ hỏi đáp hoặc không mô tả sự cố cụ thể
  let reportDraft: AssistantResponse['reportDraft'];
  if (action === 'create_report') {
    const rawDesc = (parsed.reportDraft?.description || '').trim();
    if (!rawDesc || !isMeaningfulIncidentDescription(rawDesc)) {
      // Nếu người dùng chỉ nói "mở trang tạo phản ánh" -> chuyển sang mở form trắng
      const norm = normalizeVi(sourceText);
      if (/(tao|gui|mo)\s*(phan anh|bao cao)/.test(norm) && !looksLikeQuestion(norm)) {
        action = 'navigate';
        parsed.route = '/citizen/submit';
      } else {
        action = 'chat_reply';
      }
    } else {
      const cat = VALID_CATEGORIES.includes(parsed.reportDraft?.category)
        ? (parsed.reportDraft.category as IncidentCategoryType)
        : 'other';
      reportDraft = {
        category: cat,
        customCategoryName: parsed.reportDraft?.customCategoryName || undefined,
        description: rawDesc,
      };
    }
  }

  let reportFilter: AssistantReportFilter | undefined;
  if (action === 'filter_reports' && parsed.reportFilter) {
    const rawCat = parsed.reportFilter.category;
    const rawStatus = parsed.reportFilter.status;
    reportFilter = {
      category:
        rawCat === 'all' || VALID_CATEGORIES.includes(rawCat) ? rawCat : 'all',
      status:
        rawStatus === 'pending' || rawStatus === 'resolved' || rawStatus === 'all'
          ? rawStatus
          : 'all',
      searchQuery:
        typeof parsed.reportFilter.searchQuery === 'string' &&
        parsed.reportFilter.searchQuery.trim()
          ? parsed.reportFilter.searchQuery.trim()
          : undefined,
      onlyMyReports: Boolean(parsed.reportFilter.onlyMyReports),
    };
  }

  const route =
    typeof parsed.route === 'string' && VALID_CITIZEN_ROUTES.includes(parsed.route)
      ? parsed.route
      : undefined;

  return {
    action,
    reply: parsed.reply?.trim() || 'Đã tiếp nhận yêu cầu của bạn.',
    reportDraft,
    reportFilter,
    route,
    openCamera: action === 'open_camera' || parsed.openCamera === true ? true : undefined,
    elderlyEnabled:
      typeof parsed.elderlyEnabled === 'boolean' ? parsed.elderlyEnabled : undefined,
    scrollDirection:
      parsed.scrollDirection === 'top' || parsed.scrollDirection === 'bottom'
        ? parsed.scrollDirection
        : undefined,
  };
}

const CITIZEN_COMMANDS_SPEC = `DANH SÁCH CÁC LỆNH ĐIỀU KHIỂN TRANG CÔNG DÂN ĐƯỢC HỖ TRỢ (HỖ TRỢ ĐA LỆNH TRONG 1 CÂU):
QUY TẮC ĐA LỆNH (RẤT QUAN TRỌNG):
- Nếu người dân nói NHIỀU yêu cầu trong cùng 1 câu (vd: "Tôi muốn phản ánh đèn đường bị hư ở hẻm 5 và mở camera chụp ảnh", hoặc "Bật chữ to và mở bản đồ"):
  → ĐỪNG BỎ SÓT YÊU CẦU NÀO! Hãy đặt "action" là hành động chính (vd: "create_report" hoặc "navigate") và BẬT THÊM các cờ đi kèm ("openCamera": true, "elderlyEnabled": true/false, "scrollDirection": "top"/"bottom").
  → ĐẶC BIỆT: Nếu vừa mô tả sự cố VỪA đòi chụp ảnh/mở camera → BẮT BUỘC đặt "action": "create_report", điền đầy đủ "reportDraft", VÀ đặt "openCamera": true!

Các giá trị "action" chính:
1. "chat_reply": MẶC ĐỊNH AN TOÀN — Dùng khi người dân chào hỏi, hỏi đáp quy trình, hỏi thông tin, hỏi "bạn làm được gì", hoặc câu nói không rõ ràng / im lặng. KHÔNG BAO GIỜ tự ý chuyển sang "create_report" nếu người dân không mô tả một sự cố cụ thể!
2. "navigate": Chuyển trang khi người dân yêu cầu mở trang:
   - "/citizen/home": Trang chủ
   - "/citizen/submit": Mở trang Tạo phản ánh mới (DÙNG KHI người dân chỉ nói "mở trang phản ánh", "tạo phản ánh mới" mà CHƯA mô tả sự cố cụ thể)
   - "/citizen/reports": Danh sách phản ánh toàn phường
   - "/citizen/map": Bản đồ phản ánh xung quanh
   - "/citizen/help": Trang trợ giúp & hướng dẫn
   - "/citizen/account": Trang tài khoản cá nhân
   - "/login": Trang đăng nhập
   - "/register": Trang đăng ký
3. "open_my_reports": Mở danh sách "Phản ánh của tôi" ("xem phản ánh của tôi", "kiểm tra bài đã gửi").
4. "filter_reports": Mở trang danh sách phản ánh và TỰ ĐỘNG LỌC/TÌM KIẾM theo yêu cầu ("xem phản ánh ngập nước", "lọc bài đã xử lý xong", "tìm phản ánh đường Nguyễn Ái Quốc").
   - Điền "reportFilter": { "category": "all"|"street_light"|"flooding"|"waste"|"road_damage"|"other", "status": "all"|"pending"|"resolved", "searchQuery": "từ khóa hoặc null", "onlyMyReports": true|false }
5. "open_camera": CHỈ dùng khi người dân chỉ muốn mở camera chụp ảnh mà KHÔNG mô tả sự cố cụ thể ("mở camera chụp ảnh"). Đặt thêm "openCamera": true.
6. "toggle_elderly": Bật/tắt chế độ Người cao tuổi / chữ to ("bật chữ to", "tắt chữ lớn", "chế độ người cao tuổi"). Điền "elderlyEnabled": true|false.
7. "scroll_page": Cuộn trang lên đầu hoặc xuống cuối ("lên đầu trang", "kéo xuống cuối trang"). Điền "scrollDirection": "top"|"bottom".
8. "go_back": Quay lại trang trước đó ("quay lại", "trở về trang trước").
9. "call_hotline": Liên hệ tổng đài khẩn cấp 1022 ("gọi 1022", "số đường dây nóng").
10. "logout": Đăng xuất tài khoản hiện tại ("đăng xuất", "thoát tài khoản").
11. "create_report": CHỈ DÙNG KHI người dân THỰC SỰ MÔ TẢ MỘT SỰ CỐ HIỆN TRƯỜNG CỤ THỂ để gửi phản ánh (vd: "đèn đường trước nhà tôi bị hư tối om", "có đống rác bốc mùi ở ngã tư", "ổ gà sâu trên đường").
   - Điền "reportDraft":
     * category: 1 trong ["street_light", "flooding", "waste", "road_damage", "other"]
     * customCategoryName: nếu category="other" thì ghi tên loại ngắn gọn, ngược lại null
     * description: GIỮ NGUYÊN SÁT 100% CHI TIẾT MÔ TẢ THEO ĐÚNG LỜI NGƯỜI DÂN NÓI (chỉ bỏ cụm mở đầu lệnh như "Tôi muốn phản ánh" và bỏ cụm lệnh phụ như "và mở camera chụp ảnh" nếu có; TUYỆT ĐỐI KHÔNG tự sáng tác thêm, KHÔNG viết văn mẫu, KHÔNG tự ép hay bịa tên đường).`;

export async function runCitizenAssistant(
  message: string,
  mode: 'chat' | 'voice' = 'chat',
  history: AssistantMessage[] = []
): Promise<AssistantResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: 'chat_reply',
      reply: 'Bạn hãy nhập nội dung hoặc giữ nút AI 1 giây để nói yêu cầu nhé.',
      analyzedBy: 'fallback',
    };
  }

  if (!env.GEMINI_API_KEY) {
    return fallbackAssistant(trimmed);
  }

  try {
    const [totalPublic, resolvedCount] = await Promise.all([
      IncidentModel.countDocuments({ status: { $nin: ['pending_review', 'rejected'] } }),
      IncidentModel.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ]);

    const recentHistory = history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Người dân' : 'Trợ lý'}: ${m.text}`)
      .join('\n');

    const prompt = `Bạn là Trợ lý AI thông minh của Cổng phản ánh hiện trường CTIX — UBND Phường Trấn Biên, TP. Biên Hòa, Đồng Nai.
Chế độ hiện tại: ${mode === 'voice' ? 'RA LỆNH GIỌNG NÓI (ưu tiên thực thi hành động nhanh & trả lời ngắn gọn 1 câu)' : 'CHATBOT HỎI ĐÁP & ĐIỀU KHIỂN (trả lời lịch sự, rõ ràng, ngắn gọn 1-3 câu)'}.

Thông tin thực tế hệ thống:
- Tổng phản ánh đã tiếp nhận: ${totalPublic} hồ sơ, đã xử lý hoàn tất: ${resolvedCount} hồ sơ, thời gian xử lý trung bình: ~3,2 ngày.
- Quy trình: Công dân gửi phản ánh → UBND Phường duyệt tiếp nhận → Phân công đội xử lý → Nghiệm thu ảnh sau xử lý → Công dân đánh giá 1-5 sao.
- Tổng đài hỗ trợ khẩn cấp: 1022.

${CITIZEN_COMMANDS_SPEC}

${recentHistory ? `[Lịch sử hội thoại gần nhất]:\n${recentHistory}\n` : ''}
[Tin nhắn mới của người dân]:
"${trimmed}"

Trả về JSON duy nhất đúng cấu trúc:
{
  "action": "create_report" | "open_my_reports" | "filter_reports" | "open_camera" | "navigate" | "toggle_elderly" | "scroll_page" | "go_back" | "call_hotline" | "logout" | "chat_reply",
  "reply": "Câu phản hồi tiếng Việt tự nhiên, ngắn gọn",
  "reportDraft": {
    "category": "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "customCategoryName": "string | null",
    "description": "string"
  } | null,
  "reportFilter": {
    "category": "all" | "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "status": "all" | "pending" | "resolved",
    "searchQuery": "string | null",
    "onlyMyReports": false
  } | null,
  "route": "/citizen/home" | "/citizen/submit" | "/citizen/reports" | "/citizen/map" | "/citizen/help" | "/citizen/account" | "/login" | "/register" | null,
  "openCamera": true | false | null,
  "elderlyEnabled": true | false | null,
  "scrollDirection": "top" | "bottom" | null
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          responseMimeType: 'application/json',
        },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      console.warn(`[AI Assistant] Gemini HTTP ${res.status}:`, errTxt.slice(0, 180));
      return fallbackAssistant(trimmed);
    }

    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return fallbackAssistant(trimmed);

    const parsed = JSON.parse(rawText);
    return {
      ...sanitizeAssistantOutput(parsed, trimmed),
      analyzedBy: 'gemini',
    };
  } catch (err) {
    console.warn('[AI Assistant] Fallback:', err instanceof Error ? err.message : err);
    return fallbackAssistant(trimmed);
  }
}

// Nhận trực tiếp file Audio → Gemini 2.5 Flash nghe thẳng giọng nói tiếng Việt
export async function runCitizenVoiceAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<AssistantResponse> {
  if (!env.GEMINI_API_KEY) {
    return {
      action: 'chat_reply',
      reply: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ để nhận diện âm thanh trực tiếp.',
      analyzedBy: 'fallback',
    };
  }

  const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
  const base64Audio = audioBuffer.toString('base64');

  const prompt = `Bạn là Trợ lý Giọng nói AI điều khiển trang Công dân trên ứng dụng CTIX Phường Trấn Biên.
Hãy NGHE KỸ đoạn âm thanh đính kèm và tuân thủ NGHIÊM NGẶT các quy tắc sau:

QUY TẮC CHỐNG ẢO GIÁC (QUAN TRỌNG NHẤT):
- Nếu đoạn âm thanh IM LẶNG, chỉ có tiếng gió, tiếng ồn nền, tiếng thở, tiếng gõ hoặc KHÔNG CÓ TIẾNG NGƯỜI NÓI RÕ RÀNG:
  → BẮT BUỘC trả về "transcript": "" và "action": "chat_reply", "reportDraft": null.
  → TUYỆT ĐỐI KHÔNG tự bịa câu nói, KHÔNG tự tạo phản ánh!

Nếu CÓ TIẾNG NGƯỜI NÓI RÕ:
1. "transcript": Chép lại CHÍNH XÁC NGUYÊN VĂN từng chữ người dùng đã nói bằng tiếng Việt chuẩn (không thêm bớt, không ép tên đường).
2. Chọn đúng "action" từ danh sách dưới đây:

${CITIZEN_COMMANDS_SPEC}

Trả về JSON duy nhất đúng cấu trúc:
{
  "transcript": "nguyên văn lời người nói hoặc chuỗi rỗng nếu im lặng",
  "action": "create_report" | "open_my_reports" | "filter_reports" | "open_camera" | "navigate" | "toggle_elderly" | "scroll_page" | "go_back" | "call_hotline" | "logout" | "chat_reply",
  "reply": "Câu phản hồi tiếng Việt ngắn gọn (1 câu)",
  "reportDraft": {
    "category": "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "customCategoryName": "string | null",
    "description": "string"
  } | null,
  "reportFilter": {
    "category": "all" | "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "status": "all" | "pending" | "resolved",
    "searchQuery": "string | null",
    "onlyMyReports": false
  } | null,
  "route": "/citizen/home" | "/citizen/submit" | "/citizen/reports" | "/citizen/map" | "/citizen/help" | "/citizen/account" | "/login" | "/register" | null,
  "openCamera": true | false | null,
  "elderlyEnabled": true | false | null,
  "scrollDirection": "top" | "bottom" | null
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const bodyPayload = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: base64Audio,
            },
          },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  // Tăng timeout lên 25s và tự động retry 1 lần khi gặp 429 (quá tải phút) hoặc 503
  let res: globalThis.Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: bodyPayload,
      });
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new AiServiceError(
        504,
        isAbort
          ? 'AI xử lý âm thanh hơi lâu (quá thời gian chờ). Vui lòng nói ngắn gọn hơn và thử lại.'
          : 'Không thể kết nối tới máy chủ AI Gemini. Vui lòng thử lại sau vài giây.'
      );
    }
    clearTimeout(timer);

    if (res.ok) break;
    if ((res.status === 429 || res.status === 503) && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1800));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    const status = res?.status || 500;
    const errTxt = res ? await res.text().catch(() => '') : '';
    console.warn(`[AI Voice] Gemini error (${status}):`, errTxt.slice(0, 220));
    if (status === 429) {
      throw new AiServiceError(
        429,
        'Trợ lý AI vừa nhận nhiều lệnh giọng nói liên tiếp (giới hạn lượt/phút). Vui lòng đợi vài giây rồi thử lại nhé.'
      );
    }
    if (status === 503) {
      throw new AiServiceError(
        503,
        'Máy chủ AI Gemini đang tạm bận. Vui lòng thử lại sau vài giây.'
      );
    }
    throw new AiServiceError(
      502,
      'Không thể nhận diện đoạn âm thanh này. Hãy giữ nút AI 1 giây và nói rõ hơn nhé.'
    );
  }

  const data = (await res.json()) as any;
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI không trả về dữ liệu nhận diện giọng nói.');
  }

  const parsed = JSON.parse(rawText);
  const transcript = (parsed.transcript || '').trim();

  // Nếu im lặng hoặc chỉ có ký tự tạp âm
  if (!transcript || transcript.replace(/[^\p{L}\p{N}]/gu, '').length < 2) {
    return {
      action: 'chat_reply',
      transcript: '',
      reply: 'Chưa nghe rõ giọng nói của bạn. Hãy giữ nút AI 1 giây rồi nói gần micro hơn nhé.',
      analyzedBy: 'gemini',
    };
  }

  return {
    ...sanitizeAssistantOutput(parsed, transcript),
    transcript,
    analyzedBy: 'gemini',
  };
}

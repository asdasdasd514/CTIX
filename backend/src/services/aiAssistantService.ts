import { env } from '../config/env';
import { IncidentModel } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';

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
  return /(\?|lam sao|nhu the nao|la gi|bao lau|may ngay|quy trinh|co duoc khong|o dau|ban lam duoc gi|chuc nang|co the lam gi|huong dan)/.test(
    norm
  );
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
        'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Bạn có thể ra lệnh mở trang, lọc phản ánh, bật chữ to, mở camera chụp ảnh hoặc báo cáo sự cố hiện trường.',
      analyzedBy: 'fallback',
    };
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

  // 6. Mở camera chụp ảnh phản ánh
  if (/(mo camera|chup anh|chup hinh|bat camera|bat may anh)/.test(norm)) {
    return {
      action: 'open_camera',
      route: '/citizen/submit',
      reply: 'Đang mở trang tạo phản ánh và bật camera chụp ảnh hiện trường cho bạn.',
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
    elderlyEnabled:
      typeof parsed.elderlyEnabled === 'boolean' ? parsed.elderlyEnabled : undefined,
    scrollDirection:
      parsed.scrollDirection === 'top' || parsed.scrollDirection === 'bottom'
        ? parsed.scrollDirection
        : undefined,
  };
}

const CITIZEN_COMMANDS_SPEC = `DANH SÁCH CÁC LỆNH ĐIỀU KHIỂN TRANG CÔNG DÂN ĐƯỢC HỖ TRỢ:
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
5. "open_camera": Mở trang tạo phản ánh và BẬT SẴN CAMERA chụp ảnh hiện trường ("mở camera chụp ảnh", "chụp ảnh sự cố ngay").
6. "toggle_elderly": Bật/tắt chế độ Người cao tuổi / chữ to ("bật chữ to", "tắt chữ lớn", "chế độ người cao tuổi"). Điền "elderlyEnabled": true|false.
7. "scroll_page": Cuộn trang lên đầu hoặc xuống cuối ("lên đầu trang", "kéo xuống cuối trang"). Điền "scrollDirection": "top"|"bottom".
8. "go_back": Quay lại trang trước đó ("quay lại", "trở về trang trước").
9. "call_hotline": Liên hệ tổng đài khẩn cấp 1022 ("gọi 1022", "số đường dây nóng").
10. "logout": Đăng xuất tài khoản hiện tại ("đăng xuất", "thoát tài khoản").
11. "create_report": CHỈ DÙNG KHI người dân THỰC SỰ MÔ TẢ MỘT SỰ CỐ HIỆN TRƯỜNG CỤ THỂ để gửi phản ánh (vd: "đèn đường trước nhà tôi bị hư tối om", "có đống rác bốc mùi ở ngã tư", "ổ gà sâu trên đường").
   - Điền "reportDraft":
     * category: 1 trong ["street_light", "flooding", "waste", "road_damage", "other"]
     * customCategoryName: nếu category="other" thì ghi tên loại ngắn gọn, ngược lại null
     * description: GIỮ NGUYÊN SÁT 100% CHI TIẾT MÔ TẢ THEO ĐÚNG LỜI NGƯỜI DÂN NÓI (chỉ bỏ cụm mở đầu lệnh như "Tôi muốn phản ánh" nếu có; TUYỆT ĐỐI KHÔNG tự sáng tác thêm, KHÔNG viết văn mẫu, KHÔNG tự ép hay bịa tên đường).`;

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
  "elderlyEnabled": true | false | null,
  "scrollDirection": "top" | "bottom" | null
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

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
  "elderlyEnabled": true | false | null,
  "scrollDirection": "top" | "bottom" | null
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
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
    }),
  });
  clearTimeout(timer);

  if (!res.ok) {
    const errTxt = await res.text().catch(() => '');
    throw new Error(`Gemini Audio API error (${res.status}): ${errTxt.slice(0, 180)}`);
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

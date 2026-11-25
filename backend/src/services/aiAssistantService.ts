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

export interface ImageClassifyResult {
  category: IncidentCategoryType;
  customCategoryName?: string;
  description: string;
  analyzedBy: 'gemini';
  modelUsed: string;
}

/**
 * Phân loại sự cố đô thị trực tiếp từ ảnh hiện trường bằng Gemini Vision (xoay vòng Multi-Key & Model Cascade).
 */
export async function classifyIncidentImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ImageClassifyResult> {
  const keys = env.GEMINI_API_KEYS;
  if (!keys.length) {
    throw new AiServiceError(503, 'Chưa cấu hình khóa Gemini AI.');
  }

  const prompt = `Bạn là trợ lý AI phân loại sự cố đô thị cho UBND Phường Trấn Biên (TP. Biên Hòa, Đồng Nai).
Hãy quan sát ảnh hiện trường này và trả về DUY NHẤT 1 JSON hợp lệ (không markdown, không giải thích thêm):
{
  "category": "street_light" | "flooding" | "waste" | "road_damage" | "other",
  "customCategoryName": "Tên ngắn gọn nếu category là other (VD: Cây xanh ngã đổ, Nắp cống vỡ, Dây điện võng, Sự cố hiện trường khác)",
  "description": "Mô tả ngắn gọn 1 câu tiếng Việt (15-35 từ) về tình trạng thấy trong ảnh"
}
Quy tắc phân loại:
- "street_light": đèn đường tắt/hỏng/nghiêng/chập điện, cột đèn chiếu sáng.
- "flooding": ngập nước, đọng nước mưa, cống thoát nước nghẹt/tràn.
- "waste": rác thải tự phát, bãi rác bừa bãi, phế thải, ô nhiễm vệ sinh.
- "road_damage": ổ gà, mặt đường nứt/sụt lún, vỉa hè hư hỏng.
- "other": các sự cố đô thị khác (cây đổ, dây điện võng, biển báo hỏng...) HOẶC ảnh không thuộc 4 nhóm trên (khi đó điền customCategoryName ngắn gọn phù hợp với nội dung ảnh và description ngắn gọn, khách quan).`;

  const base64Image = imageBuffer.toString('base64');
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];
  const validCategories: IncidentCategoryType[] = [
    'street_light',
    'flooding',
    'waste',
    'road_damage',
    'other',
  ];

  let lastStatus = 500;
  for (const model of models) {
    for (const apiKey of keys) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType || 'image/jpeg',
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.15,
                maxOutputTokens: 256,
                responseMimeType: 'application/json',
              },
            }),
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          lastStatus = res.status;
          if (res.status === 429 || res.status === 503 || res.status === 404) {
            continue;
          }
          continue;
        }

        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
        const parsed = JSON.parse(cleaned) as {
          category?: string;
          customCategoryName?: string;
          description?: string;
        };

        const category: IncidentCategoryType = validCategories.includes(
          parsed.category as IncidentCategoryType
        )
          ? (parsed.category as IncidentCategoryType)
          : 'other';

        const customCategoryName =
          category === 'other'
            ? String(parsed.customCategoryName || '').trim() || 'Sự cố hiện trường khác'
            : undefined;

        const description =
          String(parsed.description || '').trim() ||
          (category === 'other'
            ? 'Ghi nhận tình trạng hiện trường cần kiểm tra và xử lý.'
            : `Phát hiện sự cố ${CATEGORY_LABELS[category].toLowerCase()} tại hiện trường cần kiểm tra xử lý.`);

        return {
          category,
          customCategoryName,
          description,
          analyzedBy: 'gemini',
          modelUsed: model,
        };
      } catch {
        continue;
      }
    }
  }

  throw new AiServiceError(
    lastStatus === 429 ? 429 : 503,
    'AI nhận diện ảnh tạm thời bận. Bạn có thể chọn loại sự cố thủ công.'
  );
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
  modelUsed?: string;
}

interface LiveIncidentSummary {
  id: string;
  title: string;
  category: IncidentCategoryType;
  categoryLabel: string;
  address: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

interface LiveSystemContext {
  totalPublic: number;
  activeCount: number;
  resolvedCount: number;
  resolvedRate: number;
  byCategory: Record<IncidentCategoryType, number>;
  latestPublic: LiveIncidentSummary[];
  myLatest: LiveIncidentSummary[];
}

const CATEGORY_LABELS: Record<IncidentCategoryType, string> = {
  street_light: 'Đèn đường',
  flooding: 'Ngập nước',
  waste: 'Rác thải',
  road_damage: 'Mặt đường / Ổ gà',
  other: 'Sự cố khác',
};

const STATUS_LABELS_VI: Record<string, string> = {
  pending_review: 'Chờ duyệt tiếp nhận',
  pending: 'Đã duyệt, chờ phân công',
  assigned: 'Đã phân công đội xử lý',
  in_progress: 'Đang xử lý hiện trường',
  resolved: 'Đã xử lý hoàn tất',
  closed: 'Đã hoàn tất & đánh giá',
  rejected: 'Không được tiếp nhận',
};

const VALID_CATEGORIES: IncidentCategoryType[] = [
  'street_light',
  'flooding',
  'waste',
  'road_damage',
  'other',
];

const STATIC_CITIZEN_ROUTES = new Set([
  '/citizen/home',
  '/citizen/submit',
  '/citizen/reports',
  '/citizen/map',
  '/citizen/help',
  '/citizen/account',
  '/login',
  '/register',
]);

// Chuỗi model ưu tiên đang hoạt động ổn định trên Google AI Studio (mỗi model có quota miễn phí riêng)
const CHAT_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
];

const VOICE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
];

function isValidCitizenRoute(route: string): boolean {
  if (STATIC_CITIZEN_ROUTES.has(route)) return true;
  return /^\/citizen\/reports\/[a-zA-Z0-9_-]+$/.test(route);
}

function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(phone?: string): string {
  return String(phone || '').replace(/\D/g, '').trim();
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
  return /(\?|lam sao|nhu the nao|the nao|ra sao|la gi|bao lau|may ngay|quy trinh|co duoc khong|o dau|ban lam duoc gi|chuc nang|co the lam gi|huong dan|duoc xu ly|xe duoc xu ly|se duoc xu ly|tai sao|vi sao|khi nao|co mat phi|can dang nhap|gan nhat|moi nhat|bao nhieu|may bai|thong ke|ty le)/.test(
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

/**
 * Truy vấn nhanh dữ liệu thật từ MongoDB Atlas làm ngữ cảnh cho cả Gemini lẫn Fallback.
 */
async function buildLiveContext(userPhone?: string): Promise<LiveSystemContext> {
  const cleanPhone = normalizePhone(userPhone);
  try {
    const [publicDocs, myDocs] = await Promise.all([
      IncidentModel.find(
        { status: { $nin: ['pending_review', 'rejected'] } },
        {
          incidentId: 1,
          title: 1,
          category: 1,
          status: 1,
          'location.address': 1,
          createdAtIso: 1,
        }
      )
        .sort({ createdAtIso: -1 })
        .lean(),
      cleanPhone
        ? IncidentModel.find(
            {},
            {
              incidentId: 1,
              title: 1,
              category: 1,
              status: 1,
              'location.address': 1,
              'sender.phone': 1,
              createdAtIso: 1,
            }
          )
            .sort({ createdAtIso: -1 })
            .limit(40)
            .lean()
        : Promise.resolve([]),
    ]);

    const byCategory: Record<IncidentCategoryType, number> = {
      street_light: 0,
      flooding: 0,
      waste: 0,
      road_damage: 0,
      other: 0,
    };

    let resolvedCount = 0;
    for (const d of publicDocs) {
      const cat = VALID_CATEGORIES.includes(d.category as IncidentCategoryType)
        ? (d.category as IncidentCategoryType)
        : 'other';
      byCategory[cat] += 1;
      if (d.status === 'resolved' || d.status === 'closed') {
        resolvedCount += 1;
      }
    }

    const totalPublic = publicDocs.length;
    const activeCount = totalPublic - resolvedCount;
    const resolvedRate = totalPublic > 0 ? Math.round((resolvedCount / totalPublic) * 100) : 0;

    const toSummary = (d: any): LiveIncidentSummary => ({
      id: String(d.incidentId || d._id),
      title: String(d.title || 'Phản ánh hiện trường'),
      category: (VALID_CATEGORIES.includes(d.category) ? d.category : 'other') as IncidentCategoryType,
      categoryLabel: CATEGORY_LABELS[d.category as IncidentCategoryType] || 'Sự cố khác',
      address: String(d.location?.address || 'Phường Trấn Biên'),
      status: String(d.status || 'pending'),
      statusLabel: STATUS_LABELS_VI[d.status] || String(d.status),
      createdAt: String(d.createdAtIso || ''),
    });

    const latestPublic = publicDocs.slice(0, 5).map(toSummary);
    const myLatest = cleanPhone
      ? myDocs
          .filter((d: any) => normalizePhone(d.sender?.phone) === cleanPhone)
          .slice(0, 3)
          .map(toSummary)
      : [];

    return {
      totalPublic,
      activeCount,
      resolvedCount,
      resolvedRate,
      byCategory,
      latestPublic,
      myLatest,
    };
  } catch {
    return {
      totalPublic: 0,
      activeCount: 0,
      resolvedCount: 0,
      resolvedRate: 0,
      byCategory: { street_light: 0, flooding: 0, waste: 0, road_damage: 0, other: 0 },
      latestPublic: [],
      myLatest: [],
    };
  }
}

/**
 * Gọi Gemini với cơ chế xoay vòng nhiều Model + nhiều API Key tự động khi gặp 429/503.
 */
async function callGeminiWithCascade(params: {
  models: string[];
  bodyPayload: string;
  timeoutMs: number;
  label: string;
}): Promise<{ rawText: string; modelUsed: string } | { lastStatus: number; lastError: string }> {
  const keys = env.GEMINI_API_KEYS;
  if (keys.length === 0) {
    return { lastStatus: 0, lastError: 'Chưa cấu hình GEMINI_API_KEY.' };
  }

  let lastStatus = 500;
  let lastError = 'Không thể kết nối Gemini.';

  for (const model of params.models) {
    for (let kIdx = 0; kIdx < keys.length; kIdx++) {
      const apiKey = keys[kIdx];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), params.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: params.bodyPayload,
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = (await res.json()) as any;
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return { rawText, modelUsed: model };
          }
          continue;
        }

        lastStatus = res.status;
        const errTxt = await res.text().catch(() => '');
        lastError = errTxt.slice(0, 200);
        console.warn(
          `[${params.label}] ${model} (key#${kIdx + 1}) HTTP ${res.status}:`,
          lastError.slice(0, 120)
        );

        // Nếu 400 (request lỗi), không cần thử key khác cho cùng payload
        if (res.status === 400) {
          break;
        }
      } catch (err) {
        clearTimeout(timer);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        lastStatus = isAbort ? 504 : 502;
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  return { lastStatus, lastError };
}

/**
 * Bộ tri thức hỏi đáp thông minh CÓ ĐỌC DỮ LIỆU THẬT TỪ MONGODB (dùng khi mọi key Gemini tạm chạm quota).
 */
function answerDataOrFaqFallback(norm: string, ctx?: LiveSystemContext): AssistantResponse | null {
  // 1. Hỏi phản ánh gần nhất / mới nhất
  if (/(gan nhat|moi nhat|vua dang|vua gui|moi dang)/.test(norm)) {
    if (/(cua toi|toi gui|minh gui|cua minh)/.test(norm) && ctx?.myLatest.length) {
      const mine = ctx.myLatest[0];
      return {
        action: 'chat_reply',
        reply: `Phản ánh gần nhất của bạn là "${mine.title}" tại ${mine.address} — trạng thái hiện tại: ${mine.statusLabel}. Bạn có muốn mình mở chi tiết bài này không?`,
        analyzedBy: 'fallback',
      };
    }
    if (ctx?.latestPublic.length) {
      const latest = ctx.latestPublic[0];
      return {
        action: 'chat_reply',
        reply: `Phản ánh công khai gần nhất vừa được tiếp nhận là "${latest.title}" (${latest.categoryLabel}) tại ${latest.address} — trạng thái: ${latest.statusLabel}.`,
        analyzedBy: 'fallback',
      };
    }
  }

  // 2. Hỏi số liệu thống kê / bao nhiêu phản ánh
  if (/(bao nhieu|tong so|may bai|thong ke|ty le|da xu ly duoc)/.test(norm) && ctx && ctx.totalPublic > 0) {
    const cat = inferCategoryFallback(norm);
    if (cat) {
      return {
        action: 'chat_reply',
        reply: `Hiện hệ thống đang ghi nhận ${ctx.byCategory[cat]} phản ánh công khai thuộc nhóm ${CATEGORY_LABELS[cat]} trên địa bàn Phường Trấn Biên.`,
        analyzedBy: 'fallback',
      };
    }
    return {
      action: 'chat_reply',
      reply: `Phường Trấn Biên hiện có ${ctx.totalPublic} phản ánh công khai: ${ctx.resolvedCount} hồ sơ đã hoàn thành (${ctx.resolvedRate}%) và ${ctx.activeCount} hồ sơ đang xử lý (Đèn đường: ${ctx.byCategory.street_light}, Ngập nước: ${ctx.byCategory.flooding}, Rác thải: ${ctx.byCategory.waste}, Mặt đường/Ổ gà: ${ctx.byCategory.road_damage}).`,
      analyzedBy: 'fallback',
    };
  }

  // 3. Quy trình xử lý phản ánh
  if (/(quy trinh|xu ly nhu the nao|duoc xu ly|xe duoc xu ly|se duoc xu ly|cac buoc|tien trinh)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Phản ánh bạn gửi sẽ đi qua 4 bước: (1) UBND Phường Trấn Biên kiểm duyệt tiếp nhận trong vòng 2 giờ → (2) Phân công đội chuyên môn xử lý kèm quy trình từng bước → (3) Đội hiện trường khắc phục & tải ảnh nghiệm thu Trước – Sau → (4) Công dân kiểm tra và đánh giá 1–5 sao.',
      analyzedBy: 'fallback',
    };
  }

  // 4. Thời gian xử lý bao lâu / SLA
  if (/(bao lau|may ngay|may gio|thoi gian xu ly|sla|nhanh khong)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'UBND Phường tiếp nhận và duyệt phản ánh trong vòng 2 giờ. Thời gian khắc phục hiện trường thông thường từ 24–48 giờ (trung bình ~3,2 ngày tùy mức độ sự cố). Sự cố có nhiều người đồng phản ánh sẽ được ưu tiên xử lý trước.',
      analyzedBy: 'fallback',
    };
  }

  // 5. Cách gửi phản ánh / có cần đăng nhập không
  if (/(cach gui|lam sao.*gui|can dang nhap|khong dang nhap|chua dang nhap)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Bạn có thể gửi phản ánh ngay mà không cần đăng nhập: bấm "+ Thêm phản ánh", chụp/tải ảnh hiện trường, chọn loại sự cố, nhập mô tả (hoặc bấm micro để nói), điền Họ tên + SĐT và chọn vị trí trên bản đồ. Sau này nếu đăng ký bằng đúng SĐT đó, toàn bộ bài sẽ tự đồng bộ về tài khoản.',
      analyzedBy: 'fallback',
    };
  }

  // 6. Chỉnh sửa / Hủy phản ánh
  if (/(chinh sua|sua phan anh|huy phan anh|xoa phan anh)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Bạn chỉ có thể chỉnh sửa hoặc hủy phản ánh của chính mình khi hồ sơ đang ở trạng thái "Chờ duyệt" (trong mục Phản ánh của tôi). Khi UBND Phường đã duyệt tiếp nhận và chuyển sang xử lý, hồ sơ sẽ khóa chỉnh sửa.',
      analyzedBy: 'fallback',
    };
  }

  // 7. Vì sao chưa hiện công khai / Chờ duyệt
  if (/(chua hien|khong thay|cho duyet|cong khai)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Phản ánh mới gửi sẽ ở trạng thái "Chờ duyệt" và hiển thị ngay trong mục "Phản ánh của tôi". Sau khi Cán bộ Phường kiểm duyệt tiếp nhận, bài sẽ hiển thị công khai trên Trang chủ, Bản đồ và Danh sách toàn phường.',
      analyzedBy: 'fallback',
    };
  }

  // 8. Đồng phản ánh (+1) & gộp trùng
  if (/(dong phan anh|trung lap|gop phan anh|cong 1|\+1)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Khi nhiều người cùng gặp 1 sự cố trong bán kính 50m, hệ thống tự động gợi ý "Đồng phản ánh (+1)" để gộp ảnh hiện trường và tăng mức độ ưu tiên xử lý.',
      analyzedBy: 'fallback',
    };
  }

  // 9. Đánh giá sao & so sánh trước sau
  if (/(danh gia|cham diem|sao|truoc sau|nghiem thu)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Khi sự cố được xử lý xong, bạn có thể kéo thanh trượt so sánh ảnh Trước – Sau ngay trên trang chi tiết hồ sơ và chấm điểm từ 1–5 sao cùng nhận xét.',
      analyzedBy: 'fallback',
    };
  }

  // 10. Tổng đài / liên hệ khẩn cấp / địa chỉ UBND
  if (/(tong dai|1022|duong day nong|hotline|lien he|dia chi ubnd)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Tổng đài hỗ trợ khẩn cấp 24/7 của Phường Trấn Biên là 1022. Địa chỉ UBND Phường Trấn Biên: Số 128 Đường Nguyễn Ái Quốc, Khu phố 2, Phường Trấn Biên, TP. Biên Hòa, Đồng Nai.',
      analyzedBy: 'fallback',
    };
  }

  // 11. Hỏi AI làm được những gì
  if (/(ban lam duoc gi|co the lam gi|chuc nang|ho tro gi|lenh nao)/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Tôi có thể vừa trò chuyện giải đáp thông tin thực tế của Phường Trấn Biên (phản ánh mới nhất, số liệu thống kê, quy trình, SLA, tổng đài 1022) vừa thực hiện lệnh điều khiển trang: mở Trang chủ, Bản đồ, Phản ánh của tôi, lọc phản ánh, bật chữ lớn, mở Camera chụp ảnh hoặc gửi phản ánh bằng giọng nói.',
      analyzedBy: 'fallback',
    };
  }

  return null;
}

function fallbackAssistant(message: string, ctx?: LiveSystemContext): AssistantResponse {
  const norm = normalizeVi(message);

  // 1. Chào hỏi / câu quá ngắn
  if (norm.length < 2 || /^(alo|a lo|um|uh|a|o|hi|hello|chao|xin chao)$/.test(norm)) {
    return {
      action: 'chat_reply',
      reply:
        'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Bạn có thể hỏi thông tin thực tế (phản ánh gần nhất, quy trình xử lý, số liệu...) hoặc ra lệnh điều khiển trang ngay tại đây.',
      analyzedBy: 'fallback',
    };
  }

  // 1b. Mở trực tiếp bài phản ánh gần nhất nếu người dùng yêu cầu
  if (/(mo bai|xem bai|mo phan anh).*(gan nhat|moi nhat|do|vua roi)/.test(norm) && ctx?.latestPublic.length) {
    const latest = ctx.latestPublic[0];
    return {
      action: 'navigate',
      route: `/citizen/reports/${latest.id}`,
      reply: `Đang mở chi tiết phản ánh gần nhất: "${latest.title}".`,
      analyzedBy: 'fallback',
    };
  }

  // 1c. Ưu tiên trả lời HỎI ĐÁP THÔNG TIN / DỮ LIỆU THẬT trước khi xét lệnh điều khiển
  if (looksLikeQuestion(norm)) {
    const faq = answerDataOrFaqFallback(norm, ctx);
    if (faq) return faq;
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
  const wantsElderlyOn = /(bat|mo|tang).*(nguoi cao tuoi|chu to|chu lon|co chu)/.test(norm);
  const wantsElderlyOff = /(tat|bo|huy|giam).*(nguoi cao tuoi|chu to|chu lon|co chu)/.test(norm);
  const elderlyFlag = wantsElderlyOn ? true : wantsElderlyOff ? false : undefined;

  if (/(nguoi cao tuoi|chu to|chu lon|tang co chu|giam co chu|chu nho)/.test(norm) && !/(ban do|phan anh|trang chu|camera)/.test(norm)) {
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

  // 6. Mở camera chụp ảnh phản ánh (hỗ trợ ĐA LỆNH)
  const wantsCamera = /(mo camera|chup anh|chup hinh|bat camera|bat may anh)/.test(norm);
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
      elderlyEnabled: elderlyFlag,
      reply: 'Tổng đài hỗ trợ khẩn cấp 24/7 của Phường Trấn Biên là 1022. Đang mở trang liên hệ cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 8. Phản ánh của tôi
  if (/(phan anh cua toi|ho so cua toi|bai cua toi|xem phan anh cua toi|kiem tra phan anh cua toi)/.test(norm)) {
    return {
      action: 'open_my_reports',
      route: '/citizen/reports',
      elderlyEnabled: elderlyFlag,
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
      elderlyEnabled: elderlyFlag,
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
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở Bản đồ phản ánh khu vực Phường Trấn Biên.',
      analyzedBy: 'fallback',
    };
  }
  if (/(tro giup|huong dan)/.test(norm) && !looksLikeQuestion(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/help',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở trang Trợ giúp & Hướng dẫn.',
      analyzedBy: 'fallback',
    };
  }
  if (/(tai khoan|ho so ca nhan|thong tin ca nhan)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/account',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở trang Tài khoản cá nhân.',
      analyzedBy: 'fallback',
    };
  }
  if (/(dang nhap|mo trang dang nhap)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/login',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở trang Đăng nhập.',
      analyzedBy: 'fallback',
    };
  }
  if (/(dang ky|tao tai khoan)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/register',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở trang Đăng ký tài khoản công dân.',
      analyzedBy: 'fallback',
    };
  }
  if (/(ve trang chu|mo trang chu|trang chu)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/home',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang đưa bạn về Trang chủ.',
      analyzedBy: 'fallback',
    };
  }
  if (/(danh sach phan anh|xem phan anh|tra cuu phan anh)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/reports',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở danh sách Phản ánh toàn phường.',
      analyzedBy: 'fallback',
    };
  }

  // 11. Chỉ yêu cầu MỞ TRANG tạo phản ánh (form trắng)
  if (/^(mo trang|mo|vao|toi muon|cho toi)?\s*(gui|tao)?\s*(phan anh|bao cao)( moi)?$/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/submit',
      elderlyEnabled: elderlyFlag,
      reply: 'Đang mở trang Tạo phản ánh mới cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  // 12. Báo cáo sự cố CỤ THỂ
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
      elderlyEnabled: elderlyFlag,
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
      'Tôi có thể giúp bạn giải đáp thông tin (phản ánh gần nhất, số liệu thống kê, quy trình xử lý, tổng đài 1022) hoặc thực hiện lệnh điều khiển trang (mở Bản đồ, Phản ánh của tôi, lọc sự cố, bật chữ lớn, mở Camera chụp ảnh...). Bạn muốn hỏi hay thực hiện việc gì?',
    analyzedBy: 'fallback',
  };
}

function sanitizeAssistantOutput(
  parsed: any,
  sourceText: string
): Omit<AssistantResponse, 'transcript' | 'analyzedBy' | 'modelUsed'> {
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

  let reportDraft: AssistantResponse['reportDraft'];
  if (action === 'create_report') {
    const rawDesc = (parsed.reportDraft?.description || '').trim();
    if (!rawDesc || !isMeaningfulIncidentDescription(rawDesc)) {
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
    typeof parsed.route === 'string' && isValidCitizenRoute(parsed.route)
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
QUY TẮC PHÂN BIỆT HỎI ĐÁP vs LỆNH ĐIỀU KHIỂN:
- Nếu người dân ĐANG HỎI THÔNG TIN, TRÒ CHUYỆN, THẮC MẮC (vd: "phản ánh gần nhất là gì?", "xử lý như thế nào?", "có bao nhiêu bài ngập nước?", "hôm nay thời tiết thế nào?", "chào bạn"):
  → Chọn "action": "chat_reply" và trả lời tự nhiên, chính xác, lịch sự dựa trên dữ liệu thực tế hệ thống hoặc kiến thức chung!
- Nếu người dân RA LỆNH ĐIỀU KHIỂN TRANG (có thể gộp nhiều lệnh trong 1 câu, vd: "phản ánh đèn đường bị hư ở hẻm 5 và mở camera chụp ảnh", hoặc "bật chữ to và mở bản đồ"):
  → Đặt "action" là hành động chính và BẬT THÊM các cờ đi kèm ("openCamera": true, "elderlyEnabled": true/false, "scrollDirection": "top"/"bottom").

Các giá trị "action" chính:
1. "chat_reply": Trả lời hỏi đáp thông tin, số liệu, trò chuyện tự nhiên.
2. "navigate": Chuyển trang:
   - "/citizen/home": Trang chủ
   - "/citizen/submit": Mở trang Tạo phản ánh mới (form trắng)
   - "/citizen/reports": Danh sách phản ánh toàn phường
   - "/citizen/reports/<id>": Mở chi tiết 1 phản ánh cụ thể từ danh sách dữ liệu thật
   - "/citizen/map": Bản đồ phản ánh xung quanh
   - "/citizen/help": Trang trợ giúp & hướng dẫn
   - "/citizen/account": Trang tài khoản cá nhân
   - "/login": Trang đăng nhập
   - "/register": Trang đăng ký
3. "open_my_reports": Mở danh sách "Phản ánh của tôi".
4. "filter_reports": Mở danh sách phản ánh và lọc/tìm kiếm ("reportFilter": { "category", "status", "searchQuery", "onlyMyReports" }).
5. "open_camera": Chỉ mở camera chụp ảnh mà không mô tả sự cố cụ thể. Đặt thêm "openCamera": true.
6. "toggle_elderly": Bật/tắt chế độ Người cao tuổi / chữ to ("elderlyEnabled": true|false).
7. "scroll_page": Cuộn trang lên đầu hoặc xuống cuối ("scrollDirection": "top"|"bottom").
8. "go_back": Quay lại trang trước.
9. "call_hotline": Mở trang liên hệ tổng đài khẩn cấp 1022.
10. "logout": Đăng xuất tài khoản hiện tại.
11. "create_report": CHỈ DÙNG KHI người dân thực sự mô tả 1 sự cố hiện trường cụ thể để gửi phản ánh. Điền "reportDraft" (giữ nguyên sát 100% lời người dân nói, bỏ cụm lệnh phụ, không bịa tên đường).`;

export async function runCitizenAssistant(
  message: string,
  mode: 'chat' | 'voice' = 'chat',
  history: AssistantMessage[] = [],
  userPhone?: string
): Promise<AssistantResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: 'chat_reply',
      reply: 'Bạn hãy nhập nội dung hoặc giữ nút AI 1 giây để nói yêu cầu nhé.',
      analyzedBy: 'fallback',
    };
  }

  const liveCtx = await buildLiveContext(userPhone);

  if (env.GEMINI_API_KEYS.length === 0) {
    return fallbackAssistant(trimmed, liveCtx);
  }

  try {
    const recentHistory = history
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'Người dân' : 'Trợ lý'}: ${m.text}`)
      .join('\n');

    const latestPublicText = liveCtx.latestPublic.length
      ? liveCtx.latestPublic
          .map(
            (item, idx) =>
              `  ${idx + 1}. [id=${item.id}] "${item.title}" | Loại: ${item.categoryLabel} | Địa chỉ: ${item.address} | Trạng thái: ${item.statusLabel}`
          )
          .join('\n')
      : '  (Chưa có phản ánh công khai)';

    const myLatestText = liveCtx.myLatest.length
      ? liveCtx.myLatest
          .map(
            (item, idx) =>
              `  ${idx + 1}. [id=${item.id}] "${item.title}" | Địa chỉ: ${item.address} | Trạng thái: ${item.statusLabel}`
          )
          .join('\n')
      : '  (Người dùng chưa đăng nhập hoặc chưa có bài gửi)';

    const prompt = `Bạn là Trợ lý AI thông minh, thân thiện của Cổng phản ánh hiện trường CTIX — UBND Phường Trấn Biên, TP. Biên Hòa, Đồng Nai.
Chế độ hiện tại: ${mode === 'voice' ? 'RA LỆNH GIỌNG NÓI (ngắn gọn 1 câu)' : 'CHATBOT HỎI ĐÁP & ĐIỀU KHIỂN (tự nhiên, thông minh, rõ ràng 1-3 câu)'}.

[DỮ LIỆU THỰC TẾ THỜI GIAN THỰC TỪ MONGODB]:
- Tổng phản ánh công khai: ${liveCtx.totalPublic} hồ sơ | Đang xử lý: ${liveCtx.activeCount} | Đã hoàn thành: ${liveCtx.resolvedCount} (${liveCtx.resolvedRate}%) | Thời gian xử lý TB: ~3,2 ngày.
- Thống kê theo loại: Đèn đường (${liveCtx.byCategory.street_light}), Ngập nước (${liveCtx.byCategory.flooding}), Rác thải (${liveCtx.byCategory.waste}), Mặt đường/Ổ gà (${liveCtx.byCategory.road_damage}), Sự cố khác (${liveCtx.byCategory.other}).
- 5 phản ánh công khai mới nhất:
${latestPublicText}
- Phản ánh gần nhất của tài khoản đang đăng nhập:
${myLatestText}
- Quy trình: Công dân gửi phản ánh → UBND Phường duyệt tiếp nhận trong 2h → Phân công đội xử lý → Nghiệm thu ảnh Trước – Sau → Công dân đánh giá 1-5 sao.
- Tổng đài hỗ trợ khẩn cấp 24/7: 1022. Địa chỉ UBND Phường: 128 Nguyễn Ái Quốc, KP.2, Phường Trấn Biên.

${CITIZEN_COMMANDS_SPEC}

${recentHistory ? `[Lịch sử hội thoại gần nhất]:\n${recentHistory}\n` : ''}
[Tin nhắn mới của người dân]:
"${trimmed}"

Trả về JSON duy nhất đúng cấu trúc:
{
  "action": "create_report" | "open_my_reports" | "filter_reports" | "open_camera" | "navigate" | "toggle_elderly" | "scroll_page" | "go_back" | "call_hotline" | "logout" | "chat_reply",
  "reply": "Câu phản hồi tiếng Việt tự nhiên, rõ ràng",
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
  "route": "/citizen/home" | "/citizen/submit" | "/citizen/reports" | "/citizen/reports/<id>" | "/citizen/map" | "/citizen/help" | "/citizen/account" | "/login" | "/register" | null,
  "openCamera": true | false | null,
  "elderlyEnabled": true | false | null,
  "scrollDirection": "top" | "bottom" | null
}`;

    const bodyPayload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: 'application/json',
      },
    });

    const result = await callGeminiWithCascade({
      models: CHAT_MODELS,
      bodyPayload,
      timeoutMs: 14000,
      label: 'AI Chat',
    });

    if (!('rawText' in result)) {
      return fallbackAssistant(trimmed, liveCtx);
    }

    const parsed = JSON.parse(result.rawText);
    return {
      ...sanitizeAssistantOutput(parsed, trimmed),
      analyzedBy: 'gemini',
      modelUsed: result.modelUsed,
    };
  } catch (err) {
    console.warn('[AI Assistant] Fallback:', err instanceof Error ? err.message : err);
    return fallbackAssistant(trimmed, liveCtx);
  }
}

// Nhận trực tiếp file Audio → Gemini nghe thẳng giọng nói tiếng Việt (có xoay vòng Model + API Key)
export async function runCitizenVoiceAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<AssistantResponse> {
  if (env.GEMINI_API_KEYS.length === 0) {
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

  const result = await callGeminiWithCascade({
    models: VOICE_MODELS,
    bodyPayload,
    timeoutMs: 22000,
    label: 'AI Voice',
  });

  if (!('rawText' in result)) {
    if (result.lastStatus === 429) {
      throw new AiServiceError(
        429,
        'Trợ lý AI vừa nhận nhiều lệnh giọng nói liên tiếp (giới hạn lượt/phút). Vui lòng đợi vài giây rồi thử lại nhé.'
      );
    }
    if (result.lastStatus === 504) {
      throw new AiServiceError(
        504,
        'AI xử lý âm thanh hơi lâu (quá thời gian chờ). Vui lòng nói ngắn gọn hơn và thử lại.'
      );
    }
    throw new AiServiceError(
      502,
      'Không thể nhận diện đoạn âm thanh này lúc này. Hãy giữ nút AI 1 giây và nói rõ hơn nhé.'
    );
  }

  const parsed = JSON.parse(result.rawText);
  const transcript = (parsed.transcript || '').trim();

  if (!transcript || transcript.replace(/[^\p{L}\p{N}]/gu, '').length < 2) {
    return {
      action: 'chat_reply',
      transcript: '',
      reply: 'Chưa nghe rõ giọng nói của bạn. Hãy giữ nút AI 1 giây rồi nói gần micro hơn nhé.',
      analyzedBy: 'gemini',
      modelUsed: result.modelUsed,
    };
  }

  return {
    ...sanitizeAssistantOutput(parsed, transcript),
    transcript,
    analyzedBy: 'gemini',
    modelUsed: result.modelUsed,
  };
}

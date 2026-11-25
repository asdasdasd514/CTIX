import { env } from '../config/env';
import { IncidentModel } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';

export type AssistantAction =
  | 'create_report'
  | 'open_my_reports'
  | 'navigate'
  | 'toggle_elderly'
  | 'chat_reply';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
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
  route?: string;
  elderlyEnabled?: boolean;
  analyzedBy: 'gemini' | 'fallback';
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

function inferCategoryFallback(norm: string): IncidentCategoryType {
  if (/(den|chieu sang|bong den|cot dien|cot den|toi om|chap chon|chap tron)/.test(norm)) {
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
  return 'other';
}

function fallbackAssistant(message: string): AssistantResponse {
  const norm = normalizeVi(message);

  if (/(phan anh cua toi|ho so cua toi|xem phan anh cua toi|kiem tra phan anh)/.test(norm)) {
    return {
      action: 'open_my_reports',
      reply: 'Tôi đang mở danh sách Phản ánh của bạn ngay đây.',
      route: '/citizen/reports',
      analyzedBy: 'fallback',
    };
  }

  if (/(nguoi cao tuoi|chu to|chu lon|tang co chu)/.test(norm)) {
    const turnOff = /(tat|bo|huy)/.test(norm);
    return {
      action: 'toggle_elderly',
      elderlyEnabled: !turnOff,
      reply: turnOff
        ? 'Đã tắt chế độ Người cao tuổi.'
        : 'Đã bật chế độ Người cao tuổi với chữ lớn và độ tương phản cao.',
      analyzedBy: 'fallback',
    };
  }

  if (/(tro giup|huong dan|hotline|tong dai)/.test(norm) && !/(phan anh|bao cao)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/help',
      reply: 'Tôi đang mở trang Trợ giúp và thông tin đường dây nóng 1022 cho bạn.',
      analyzedBy: 'fallback',
    };
  }

  if (/(ve trang chu|mo trang chu|trang chu)/.test(norm)) {
    return {
      action: 'navigate',
      route: '/citizen/home',
      reply: 'Tôi đang đưa bạn về Trang chủ Phường Trấn Biên.',
      analyzedBy: 'fallback',
    };
  }

  if (
    /(phan anh|bao cao|gui su co|bao su co|den duong|ngap|rac|o ga|hu hong|bi tat|bi vo)/.test(norm)
  ) {
    const category = inferCategoryFallback(norm);
    const cleaned = message
      .replace(/^(tôi muốn|mình muốn|cho tôi|giúp tôi)\s*(gửi\s*)?(phản ánh|báo cáo)\s*/i, '')
      .trim();
    return {
      action: 'create_report',
      reply: 'Tôi đã mở trang gửi phản ánh và điền sẵn thông tin giúp bạn. Bạn chỉ cần chụp thêm ảnh hiện trường và kiểm tra vị trí nhé.',
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
      'Chào bạn! Tôi là Trợ lý AI Phường Trấn Biên. Bạn có thể hỏi về quy trình xử lý phản ánh, tổng đài 1022, hoặc nói "Tôi muốn phản ánh..." để tôi tự điền hồ sơ giúp bạn.',
    analyzedBy: 'fallback',
  };
}

export async function runCitizenAssistant(
  message: string,
  mode: 'chat' | 'voice' = 'chat',
  history: AssistantMessage[] = []
): Promise<AssistantResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: 'chat_reply',
      reply: 'Bạn hãy nhập nội dung hoặc giữ nút Micro để nói yêu cầu nhé.',
      analyzedBy: 'fallback',
    };
  }

  if (!env.GEMINI_API_KEY) {
    return fallbackAssistant(trimmed);
  }

  try {
    // Lấy nhanh số liệu thực tế từ MongoDB làm ngữ cảnh cho AI
    const [totalPublic, resolvedCount] = await Promise.all([
      IncidentModel.countDocuments({ status: { $nin: ['pending_review', 'rejected'] } }),
      IncidentModel.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ]);

    const recentHistory = history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Người dân' : 'Trợ lý'}: ${m.text}`)
      .join('\n');

    const prompt = `Bạn là Trợ lý AI thông minh của Cổng phản ánh hiện trường CTIX — UBND Phường Trấn Biên, TP. Biên Hòa, Đồng Nai.
Chế độ hiện tại: ${mode === 'voice' ? 'RA LỆNH GIỌNG NÓI (ưu tiên thực thi hành động nhanh & trả lời thật ngắn gọn 1 câu)' : 'CHATBOT HỎI ĐÁP (trả lời lịch sự, rõ ràng, ngắn gọn 1-3 câu)'}.

Thông tin thực tế hệ thống:
- Tổng phản ánh đã tiếp nhận: ${totalPublic} hồ sơ, đã xử lý hoàn tất: ${resolvedCount} hồ sơ, thời gian xử lý trung bình: ~3,2 ngày.
- Quy trình: Công dân gửi phản ánh → UBND Phường duyệt tiếp nhận → Phân công đội xử lý (kèm quy trình từng bước) → Nghiệm thu ảnh sau xử lý → Công dân đánh giá 1-5 sao.
- Tổng đài hỗ trợ khẩn cấp: 1022.

Quy tắc chọn "action":
1. "create_report": Khi người dân muốn gửi phản ánh / báo cáo một sự cố hiện trường (vd: "tôi muốn phản ánh đèn đường...", "báo cáo ổ gà...", "có đống rác bốc mùi...").
   - Bóc tách "reportDraft":
     * category: chọn 1 trong ["street_light", "flooding", "waste", "road_damage", "other"]
     * customCategoryName: nếu category="other" thì ghi tên loại ngắn gọn (vd "Cây xanh ngã đổ"), ngược lại null
     * description: GIỮ NGUYÊN SÁT 100% CHI TIẾT MÔ TẢ THEO ĐÚNG LỜI NGƯỜI DÂN NÓI (chỉ bỏ cụm mở đầu lệnh như "Tôi muốn phản ánh", "Cho tôi báo cáo" nếu có; TUYỆT ĐỐI KHÔNG tự sáng tác thêm, KHÔNG viết lại kiểu văn mẫu, KHÔNG tự ép hay tự bịa tên đường).
2. "open_my_reports": Khi người dân muốn xem danh sách phản ánh của mình ("xem phản ánh của tôi", "kiểm tra hồ sơ đã gửi").
3. "toggle_elderly": Khi người dân muốn bật/tắt chế độ người cao tuổi / chữ to ("bật chữ lớn", "tắt chế độ người cao tuổi").
4. "navigate": Khi người dân muốn chuyển sang trang khác:
   - "/citizen/home" (Trang chủ)
   - "/citizen/reports" (Danh sách phản ánh chung)
   - "/citizen/help" (Trợ giúp / Hotline)
   - "/citizen/account" (Tài khoản)
5. "chat_reply": Khi người dân chỉ hỏi đáp thông tin, chào hỏi, thắc mắc quy trình.

${recentHistory ? `[Lịch sử hội thoại gần nhất]:\n${recentHistory}\n` : ''}
[Tin nhắn mới của người dân]:
"${trimmed}"

Trả về JSON duy nhất đúng cấu trúc:
{
  "action": "create_report" | "open_my_reports" | "navigate" | "toggle_elderly" | "chat_reply",
  "reply": "Câu phản hồi tiếng Việt tự nhiên, ngắn gọn",
  "reportDraft": {
    "category": "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "customCategoryName": "string | null",
    "description": "string",
    "addressHint": "string | null"
  } | null,
  "route": "/citizen/home" | "/citizen/reports" | "/citizen/help" | "/citizen/account" | "/citizen/submit" | null,
  "elderlyEnabled": true | false | null
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
          temperature: 0.2,
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

    const parsed = JSON.parse(rawText) as {
      action?: AssistantAction;
      reply?: string;
      reportDraft?: {
        category?: IncidentCategoryType;
        customCategoryName?: string | null;
        description?: string;
        addressHint?: string | null;
      } | null;
      route?: string | null;
      elderlyEnabled?: boolean | null;
    };

    const action: AssistantAction = parsed.action || 'chat_reply';
    const validCategories: IncidentCategoryType[] = [
      'street_light',
      'flooding',
      'waste',
      'road_damage',
      'other',
    ];

    return {
      action,
      reply:
        parsed.reply?.trim() ||
        'Tôi đã tiếp nhận yêu cầu của bạn.',
      reportDraft:
        action === 'create_report' && parsed.reportDraft
          ? {
              category: validCategories.includes(parsed.reportDraft.category as IncidentCategoryType)
                ? (parsed.reportDraft.category as IncidentCategoryType)
                : 'other',
              customCategoryName: parsed.reportDraft.customCategoryName || undefined,
              description: parsed.reportDraft.description?.trim() || trimmed,
            }
          : undefined,
      route: parsed.route || undefined,
      elderlyEnabled:
        typeof parsed.elderlyEnabled === 'boolean' ? parsed.elderlyEnabled : undefined,
      analyzedBy: 'gemini',
    };
  } catch (err) {
    console.warn('[AI Assistant] Fallback:', err instanceof Error ? err.message : err);
    return fallbackAssistant(trimmed);
  }
}

// Nhận trực tiếp file Audio từ điện thoại → Gemini 2.5 Flash nghe thẳng giọng nói tiếng Việt
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

  const prompt = `Bạn là Trợ lý Giọng nói AI cho công dân trên ứng dụng phản ánh hiện trường CTIX.
Hãy NGHE KỸ đoạn âm thanh tiếng Việt đính kèm và thực hiện đúng 3 việc:

1. "transcript": Chép lại CHÍNH XÁC NGUYÊN VĂN từng chữ người dùng đã nói bằng tiếng Việt chuẩn (không thêm bớt, không ép hay tự bịa tên đường). Nếu âm thanh im lặng hoặc không có tiếng nói rõ, trả về chuỗi rỗng "".
2. "action": Xác định ý định của người nói:
   - "create_report": Khi người dùng muốn gửi phản ánh / báo cáo một sự cố hiện trường (vd "tôi muốn phản ánh...", "báo cáo...", hoặc mô tả sự cố đèn đường, ngập nước, rác thải, ổ gà, cây đổ...).
   - "open_my_reports": Khi muốn xem danh sách phản ánh của mình.
   - "toggle_elderly": Khi muốn bật/tắt chế độ người cao tuổi / chữ to.
   - "navigate": Khi muốn mở trang khác ("/citizen/home", "/citizen/reports", "/citizen/help", "/citizen/account").
   - "chat_reply": Khi hỏi đáp bình thường hoặc không rõ lệnh.
3. Nếu action là "create_report", điền "reportDraft":
   - "category": chọn 1 trong ["street_light", "flooding", "waste", "road_damage", "other"]
   - "customCategoryName": nếu category="other" thì ghi tên loại ngắn gọn, ngược lại null
   - "description": LẤY ĐÚNG NGUYÊN CHI TIẾT MÔ TẢ THEO ĐÚNG LỜI NGƯỜI DÙNG VỪA NÓI (chỉ bỏ cụm mở đầu lệnh như "Tôi muốn phản ánh", "Cho tôi báo cáo" nếu có; TUYỆT ĐỐI KHÔNG tự viết lại văn mẫu, KHÔNG thêm chi tiết người dùng không nói, KHÔNG ép/sửa tên đường).

Trả về JSON duy nhất đúng cấu trúc:
{
  "transcript": "nguyên văn lời người nói",
  "action": "create_report" | "open_my_reports" | "navigate" | "toggle_elderly" | "chat_reply",
  "reply": "Câu phản hồi tiếng Việt thật ngắn gọn (1 câu)",
  "reportDraft": {
    "category": "street_light" | "flooding" | "waste" | "road_damage" | "other",
    "customCategoryName": "string | null",
    "description": "string"
  } | null,
  "route": "/citizen/home" | "/citizen/reports" | "/citizen/help" | "/citizen/account" | "/citizen/submit" | null,
  "elderlyEnabled": true | false | null
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

  const parsed = JSON.parse(rawText) as {
    transcript?: string;
    action?: AssistantAction;
    reply?: string;
    reportDraft?: {
      category?: IncidentCategoryType;
      customCategoryName?: string | null;
      description?: string;
    } | null;
    route?: string | null;
    elderlyEnabled?: boolean | null;
  };

  const transcript = (parsed.transcript || '').trim();
  if (!transcript) {
    return {
      action: 'chat_reply',
      transcript: '',
      reply: 'Chưa nghe rõ giọng nói của bạn. Hãy giữ nút AI 1 giây rồi nói gần micro hơn nhé.',
      analyzedBy: 'gemini',
    };
  }

  const action: AssistantAction = parsed.action || 'chat_reply';
  const validCategories: IncidentCategoryType[] = [
    'street_light',
    'flooding',
    'waste',
    'road_damage',
    'other',
  ];

  return {
    action,
    transcript,
    reply: parsed.reply?.trim() || 'Đã nhận lệnh giọng nói của bạn.',
    reportDraft:
      action === 'create_report' && parsed.reportDraft
        ? {
            category: validCategories.includes(parsed.reportDraft.category as IncidentCategoryType)
              ? (parsed.reportDraft.category as IncidentCategoryType)
              : 'other',
            customCategoryName: parsed.reportDraft.customCategoryName || undefined,
            description: parsed.reportDraft.description?.trim() || transcript,
          }
        : undefined,
    route: parsed.route || undefined,
    elderlyEnabled:
      typeof parsed.elderlyEnabled === 'boolean' ? parsed.elderlyEnabled : undefined,
    analyzedBy: 'gemini',
  };
}

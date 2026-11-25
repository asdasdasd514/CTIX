import { env } from '../config/env';
import type { IIncident } from '../models/Incident';
import type { IncidentCategoryType } from '../models/Unit';

export interface DuplicateQueryInput {
  title?: string;
  description: string;
  category: IncidentCategoryType;
  lat: number;
  lng: number;
}

export interface DuplicateAnalysisItem {
  incidentId: string;
  distanceMeters: number;
  isDuplicate: boolean;
  confidence: number; // 0..100
  reason: string;
}

export interface DuplicateAnalysisResult {
  matches: DuplicateAnalysisItem[];
  suggestedCategory?: IncidentCategoryType;
  analyzedBy: 'gemini' | 'ngram';
}

const CATEGORY_LABELS_VI: Record<IncidentCategoryType, string> = {
  street_light: 'Đèn đường / chiếu sáng',
  flooding: 'Ngập nước / thoát nước / cống',
  waste: 'Rác thải / vệ sinh môi trường',
  road_damage: 'Mặt đường / ổ gà / hạ tầng giao thông',
  other: 'Sự cố khác',
};

// Tính khoảng cách Haversine giữa 2 tọa độ (đơn vị: mét)
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Chuẩn hóa tiếng Việt bỏ dấu cho fallback N-gram
function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTrigrams(text: string): Set<string> {
  const padded = `  ${normalizeVi(text)}  `;
  const set = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    set.add(padded.slice(i, i + 3));
  }
  return set;
}

function diceSimilarity(a: string, b: string): number {
  const sa = getTrigrams(a);
  const sb = getTrigrams(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  sa.forEach((g) => {
    if (sb.has(g)) inter++;
  });
  return (2 * inter) / (sa.size + sb.size);
}

const KEYWORD_HINTS: Record<Exclude<IncidentCategoryType, 'other'>, string[]> = {
  street_light: ['den', 'chieu sang', 'bong den', 'cot dien', 'cot den', 'chap chon', 'chap tron', 'toi om', 'toi thui', 'mat dien'],
  flooding: ['ngap', 'cong', 'thoat nuoc', 'ho ga', 'nuoc u', 'dong nuoc', 'lenh lang', 'nghet cong', 'tac cong'],
  waste: ['rac', 'mui hoi', 've sinh', 'xa ban', 'phe thai', 'bai rac', 'boc mui'],
  road_damage: ['o ga', 'mat duong', 'sut lun', 'nhua duong', 'ho sau', 'bong troc', 'via he', 'nut duong'],
};

function inferCategoryFromText(text: string): IncidentCategoryType | undefined {
  const norm = normalizeVi(text);
  let bestCat: IncidentCategoryType | undefined;
  let bestHits = 0;
  (Object.keys(KEYWORD_HINTS) as Exclude<IncidentCategoryType, 'other'>[]).forEach((cat) => {
    const hits = KEYWORD_HINTS[cat].filter((kw) => norm.includes(kw)).length;
    if (hits > bestHits) {
      bestHits = hits;
      bestCat = cat;
    }
  });
  return bestHits > 0 ? bestCat : undefined;
}

// Lớp dự phòng (0ms) dùng N-gram + suy luận từ khóa khi AI không khả dụng
function fallbackAnalyze(
  input: DuplicateQueryInput,
  nearby: { doc: IIncident; distance: number }[]
): DuplicateAnalysisResult {
  const inputText = `${input.title || ''} ${input.description}`.trim();
  const inferredInputCat =
    input.category === 'other' ? inferCategoryFromText(inputText) : input.category;

  const matches: DuplicateAnalysisItem[] = nearby.map(({ doc, distance }) => {
    const docText = `${doc.title} ${doc.description}`;
    const inferredDocCat =
      doc.category === 'other' ? inferCategoryFromText(docText) : doc.category;

    const sim = diceSimilarity(inputText, docText); // 0..1
    let score = Math.round(sim * 45);
    const reasons: string[] = [];

    if (distance <= 20) {
      score += 25;
      reasons.push(`rất gần (${distance}m)`);
    } else {
      score += 12;
      reasons.push(`cách ${distance}m`);
    }

    if (input.category === doc.category && input.category !== 'other') {
      score += 35;
      reasons.push(`cùng nhóm ${CATEGORY_LABELS_VI[doc.category]}`);
    } else if (inferredInputCat && inferredDocCat && inferredInputCat === inferredDocCat) {
      score += 35;
      reasons.push(`nội dung cùng liên quan ${CATEGORY_LABELS_VI[inferredDocCat]}`);
    } else if (input.category === 'other' || doc.category === 'other') {
      score += 15;
      reasons.push('có 1 phản ánh thuộc nhóm Sự cố khác');
    }

    const confidence = Math.min(98, Math.max(5, score));
    return {
      incidentId: doc.incidentId,
      distanceMeters: distance,
      isDuplicate: confidence >= 60,
      confidence,
      reason: `Đối chiếu nhanh: ${reasons.join(', ')}.`,
    };
  });

  return {
    matches: matches.sort((a, b) => b.confidence - a.confidence),
    suggestedCategory:
      input.category === 'other' && inferredInputCat && inferredInputCat !== 'other'
        ? inferredInputCat
        : undefined,
    analyzedBy: 'ngram',
  };
}

// Lớp chính: Gọi Gemini 2.5 Flash phân tích ngữ nghĩa chéo loại & chịu lỗi chính tả
export async function analyzeDuplicatesWithAI(
  input: DuplicateQueryInput,
  nearby: { doc: IIncident; distance: number }[]
): Promise<DuplicateAnalysisResult> {
  if (nearby.length === 0) {
    return { matches: [], analyzedBy: 'ngram' };
  }

  if (!env.GEMINI_API_KEY) {
    return fallbackAnalyze(input, nearby);
  }

  try {
    const candidatesPayload = nearby.slice(0, 8).map(({ doc, distance }) => ({
      incidentId: doc.incidentId,
      code: doc.code,
      category: doc.category,
      categoryLabel: CATEGORY_LABELS_VI[doc.category],
      title: doc.title,
      description: doc.description,
      address: doc.location.address,
      distanceMeters: distance,
    }));

    const prompt = `Bạn là trợ lý AI điều phối đô thị thông minh cho UBND Phường Trấn Biên.
Hãy đối chiếu [Phản ánh mới] với danh sách [Các phản ánh đang mở trong bán kính 50m] để xác định xem có phải CÙNG MỘT SỰ CỐ HIỆN TRƯỜNG hay không.

Lưu ý quan trọng:
- Người dân có thể viết sai chính tả (vd "đèn chập trờn" = "đèn chập chờn"), dùng từ đời thường ("tối om" = "đèn đường tắt", "nước lênh láng" = "ngập nước"), hoặc chọn nhầm loại / chọn "other" (Sự cố khác).
- Nếu 2 phản ánh nói về 2 hiện trường KHÁC NHAU (vd 1 bên đèn đường, 1 bên rác thải, hoặc 2 vị trí rõ ràng khác nhau dù gần 50m) thì đánh giá isDuplicate=false và confidence thấp (< 40).
- Nếu 2 phản ánh khả năng cao nói về cùng 1 sự cố (dù khác loại hoặc 1 bên là "other") thì đánh giá isDuplicate=true và confidence >= 65.
- Nếu phản ánh mới chọn "other" hoặc chọn sai loại rõ rệt, gợi ý suggestedCategory chuẩn trong ["street_light", "flooding", "waste", "road_damage"] (hoặc null nếu đã đúng).

[Phản ánh mới]:
- Loại đã chọn: ${input.category} (${CATEGORY_LABELS_VI[input.category]})
- Tiêu đề: ${input.title || '(chưa có)'}
- Mô tả: ${input.description}

[Các phản ánh đang mở trong bán kính 50m]:
${JSON.stringify(candidatesPayload, null, 2)}

Trả về JSON duy nhất đúng cấu trúc:
{
  "suggestedCategory": "street_light" | "flooding" | "waste" | "road_damage" | null,
  "matches": [
    {
      "incidentId": "string",
      "isDuplicate": boolean,
      "confidence": number (0-100),
      "reason": "1 câu tiếng Việt ngắn gọn giải thích vì sao trùng hoặc khác"
    }
  ]
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
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      return fallbackAnalyze(input, nearby);
    }

    const data = (await res.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return fallbackAnalyze(input, nearby);
    }

    const parsed = JSON.parse(rawText) as {
      suggestedCategory?: IncidentCategoryType | null;
      matches?: {
        incidentId: string;
        isDuplicate: boolean;
        confidence: number;
        reason: string;
      }[];
    };

    const distMap = new Map(nearby.map((n) => [n.doc.incidentId, n.distance]));
    const aiMatches: DuplicateAnalysisItem[] = (parsed.matches || [])
      .filter((m) => distMap.has(m.incidentId))
      .map((m) => ({
        incidentId: m.incidentId,
        distanceMeters: distMap.get(m.incidentId) || 0,
        isDuplicate: Boolean(m.isDuplicate) || Number(m.confidence) >= 60,
        confidence: Math.min(100, Math.max(0, Math.round(Number(m.confidence) || 0))),
        reason: m.reason || 'Phân tích ngữ nghĩa bởi AI Gemini.',
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const validSuggested =
      parsed.suggestedCategory &&
      ['street_light', 'flooding', 'waste', 'road_damage'].includes(parsed.suggestedCategory) &&
      parsed.suggestedCategory !== input.category
        ? (parsed.suggestedCategory as IncidentCategoryType)
        : undefined;

    return {
      matches: aiMatches,
      suggestedCategory: validSuggested,
      analyzedBy: 'gemini',
    };
  } catch (err) {
    console.warn('[AI Duplicate] Fallback to N-gram:', err instanceof Error ? err.message : err);
    return fallbackAnalyze(input, nearby);
  }
}

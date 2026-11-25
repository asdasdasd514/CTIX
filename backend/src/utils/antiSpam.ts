import type { Request } from 'express';

const IP_COOLDOWN_MS = 2 * 60 * 1000; // 2 phút / lần gửi theo IP
const ipLastSubmitMap = new Map<string, number>();

const SPAM_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /\b(bit\.ly|tinyurl\.com|zalo\.me|t\.me|facebook\.com|shopee\.vn)\b/i,
  /(vay von|cho vay|lai suat thap|ca cuoc|tai xiu|lo de|nha cai|ban dat gia re|tuyen dung viec nhe|kiem tien online|sim so dep)/i,
  /\b(dmm|dkm|vcl|vl|cc|cac|lon|buoi|dit me|du ma|dm)\b/i,
];

const JUNK_ONLY_PATTERNS: RegExp[] = [
  /^(test|testing|demo|abc|abcd|abcdef|asdf|qwerty|123|1234|12345|123456|alo|hello|hi|ok|oke|khong co gi|khong biet|cha biet|ko biet)+$/i,
];

function normalizeForCheck(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    return xff[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function checkIpRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number; message: string } {
  if (!ip || ip === 'unknown') return { ok: true };
  const now = Date.now();
  const last = ipLastSubmitMap.get(ip);
  if (last && now - last < IP_COOLDOWN_MS) {
    const retryAfterSec = Math.max(1, Math.ceil((IP_COOLDOWN_MS - (now - last)) / 1000));
    return {
      ok: false,
      retryAfterSec,
      message: `Bạn vừa gửi một phản ánh gần đây. Vui lòng đợi thêm ${retryAfterSec} giây trước khi gửi phản ánh tiếp theo (chống spam).`,
    };
  }
  return { ok: true };
}

export function recordIpSubmission(ip: string): void {
  if (!ip || ip === 'unknown') return;
  const now = Date.now();
  ipLastSubmitMap.set(ip, now);

  // Dọn bộ nhớ định kỳ nếu map quá lớn
  if (ipLastSubmitMap.size > 2000) {
    for (const [k, ts] of ipLastSubmitMap.entries()) {
      if (now - ts > IP_COOLDOWN_MS * 2) {
        ipLastSubmitMap.delete(k);
      }
    }
  }
}

export function validateIncidentContent(
  description: string,
  title?: string
): { ok: true } | { ok: false; message: string } {
  const desc = (description || '').trim();
  if (desc.length < 10) {
    return {
      ok: false,
      message: 'Mô tả sự cố quá ngắn (tối thiểu 10 ký tự). Vui lòng mô tả rõ tình trạng hiện trường.',
    };
  }

  const normDesc = normalizeForCheck(desc);
  const combinedNorm = normalizeForCheck(`${title || ''} ${desc}`);

  // Chặn ký tự lặp vô nghĩa (vd: "aaaaaaaa", "11111111")
  if (/(.)\1{5,}/.test(normDesc.replace(/\s+/g, ''))) {
    return {
      ok: false,
      message: 'Nội dung chứa chuỗi ký tự lặp không hợp lệ. Vui lòng mô tả đúng sự cố thực tế.',
    };
  }

  // Chặn nội dung chỉ có chữ cái/số test vô nghĩa
  const alphaNumOnly = normDesc.replace(/[^a-z0-9\s]/g, '').trim();
  if (JUNK_ONLY_PATTERNS.some((re) => re.test(alphaNumOnly))) {
    return {
      ok: false,
      message: 'Nội dung mô tả chưa rõ ràng hoặc có dấu hiệu thử nghiệm/rác. Vui lòng mô tả cụ thể sự cố.',
    };
  }

  // Phải có ít nhất 2 từ có nghĩa
  const words = alphaNumOnly.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length < 2) {
    return {
      ok: false,
      message: 'Vui lòng mô tả sự cố chi tiết hơn (tối thiểu 2 từ trở lên).',
    };
  }

  // Chặn link quảng cáo, từ khóa spam, từ ngữ thô tục
  if (SPAM_PATTERNS.some((re) => re.test(combinedNorm))) {
    return {
      ok: false,
      message: 'Nội dung bị từ chối do chứa liên kết quảng cáo, từ khóa spam hoặc ngôn từ không phù hợp.',
    };
  }

  return { ok: true };
}

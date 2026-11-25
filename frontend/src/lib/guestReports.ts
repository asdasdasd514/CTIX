const GUEST_IDS_KEY = 'ctix_guest_report_ids_v1';
const GUEST_PHONE_KEY = 'ctix_guest_phone_v1';

export function normalizePhone(phone?: string): string {
  return (phone || '').replace(/[\s.-]/g, '').trim();
}

export function getGuestReportIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function getGuestPhone(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(GUEST_PHONE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGuestReport(id: string, phone?: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = new Set(getGuestReportIds());
    ids.add(id);
    window.localStorage.setItem(GUEST_IDS_KEY, JSON.stringify(Array.from(ids)));
    const clean = normalizePhone(phone);
    if (clean) {
      window.localStorage.setItem(GUEST_PHONE_KEY, clean);
    }
  } catch {
    // ignore storage errors
  }
}

export function replaceGuestReportId(oldId: string, newId: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getGuestReportIds();
    if (!ids.includes(oldId)) return;
    const next = Array.from(new Set(ids.map((x) => (x === oldId ? newId : x))));
    window.localStorage.setItem(GUEST_IDS_KEY, JSON.stringify(next));
  } catch {}
}

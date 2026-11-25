import type { Incident, NewIncidentInput, IncidentCategory, IncidentPriority, WorkflowStep } from '../types/incident';

export const API_BASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ||
  'http://localhost:4000/api';

const TOKEN_KEY = 'ctix_jwt_token_v1';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Lỗi kết nối máy chủ (${res.status})`);
  }
  return data as T;
}

// 1. Auth API
export const authApi = {
  login: (identifier: string, password: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  register: (payload: {
    name?: string;
    phone: string;
    email?: string;
    password: string;
    confirmPassword?: string;
  }) =>
    apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  demoLogin: (role: string) =>
    apiRequest<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  me: () => apiRequest<{ user: any }>('/auth/me'),
};

// 2. Media Upload API (Cloudinary)
export const mediaApi = {
  uploadFiles: async (files: File[], phase: 'before' | 'after' = 'before'): Promise<string[]> => {
    const formData = new FormData();
    formData.append('phase', phase);
    files.forEach((f) => formData.append('files', f));
    const res = await apiRequest<{ urls: string[] }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
    return res.urls;
  },
};

// 3. Incidents API (MOD-01 -> MOD-05)
export interface DuplicateCandidate {
  incident: Incident;
  distanceMeters: number;
  isDuplicate: boolean;
  confidence: number;
  reason: string;
}

export interface CheckDuplicateResponse {
  candidates: DuplicateCandidate[];
  suggestedCategory?: IncidentCategory;
  analyzedBy: 'gemini' | 'ngram';
}

export const incidentsApi = {
  list: () => apiRequest<{ incidents: Incident[]; total: number }>('/incidents'),
  checkDuplicate: (payload: {
    title?: string;
    description: string;
    category: IncidentCategory;
    lat: number;
    lng: number;
    radiusMeters?: number;
    excludeId?: string;
  }) =>
    apiRequest<CheckDuplicateResponse>('/incidents/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  linkDuplicate: (
    id: string,
    payload: { senderName: string; senderPhone: string; photos: string[] }
  ) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/link-duplicate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  mergeIncidents: (targetId: string, sourceId: string, newCategory?: IncidentCategory) =>
    apiRequest<{ incident: Incident; mergedSourceId: string }>(
      `/incidents/${encodeURIComponent(targetId)}/merge/${encodeURIComponent(sourceId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ newCategory }),
      }
    ),
  create: (input: NewIncidentInput) =>
    apiRequest<{ incident: Incident }>('/incidents', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (
    id: string,
    patch: Partial<{
      title: string;
      description: string;
      category: IncidentCategory;
      location: { lat: number; lng: number; address: string; ward?: string };
      photosBefore: string[];
    }>
  ) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/incidents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  upvote: (id: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/upvote`, {
      method: 'POST',
    }),
  rate: (id: string, stars: number, comment?: string, criteria?: string[]) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/rating`, {
      method: 'POST',
      body: JSON.stringify({ stars, comment, criteria }),
    }),
  approve: (id: string, officerName?: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ officerName }),
    }),
  reject: (id: string, reason: string, officerName?: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, officerName }),
    }),
  assign: (
    id: string,
    payload: {
      unitName: string;
      deadlineDays: number;
      officerName?: string;
      priority?: IncidentPriority;
      category?: IncidentCategory;
      assigneeId?: string;
      assigneeName?: string;
      notes?: string;
      reason?: string;
      expectedUpdatedAt?: string;
      workflowSteps?: WorkflowStep[];
    }
  ) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  toggleWorkflowStep: (id: string, stepId: string, actorName?: string) =>
    apiRequest<{ incident: Incident }>(
      `/incidents/${encodeURIComponent(id)}/workflow/${encodeURIComponent(stepId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ actorName }),
      }
    ),
  verify: (id: string, notes?: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  start: (id: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/start`, {
      method: 'POST',
    }),
  resolve: (id: string, notes: string, photosAfter: string[], officerName?: string) =>
    apiRequest<{ incident: Incident }>(`/incidents/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes, photosAfter, officerName }),
    }),
};

// 4. Teams & Members API (MOD-04)
export const teamsApi = {
  getAll: () => apiRequest<{ units: any[]; members: any[] }>('/teams'),
  createUnit: (unit: any) =>
    apiRequest<{ unit: any }>('/teams/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    }),
  updateUnit: (id: string, patch: any) =>
    apiRequest<{ unit: any }>(`/teams/units/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteUnit: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/teams/units/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createMember: (member: any) =>
    apiRequest<{ member: any }>('/teams/members', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
  updateMember: (id: string, patch: any) =>
    apiRequest<{ member: any }>(`/teams/members/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteMember: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/teams/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// 5. Users / Accounts Management API (Admin)
export interface AccountRecord {
  id: string;
  name: string;
  title: string;
  role: 'citizen' | 'officer' | 'leader' | 'volunteer';
  department: string;
  unitId?: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export const usersApi = {
  list: () => apiRequest<{ users: AccountRecord[] }>('/users'),
  create: (payload: {
    name: string;
    phone: string;
    password: string;
    role: 'citizen' | 'officer' | 'leader' | 'volunteer';
    title?: string;
    unitId?: string;
  }) =>
    apiRequest<{ user: AccountRecord }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    patch: Partial<{
      name: string;
      phone: string;
      password: string;
      role: 'citizen' | 'officer' | 'leader' | 'volunteer';
      title: string;
      unitId: string;
      isActive: boolean;
    }>
  ) =>
    apiRequest<{ user: AccountRecord }>(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// 6. Citizen AI Assistant API (Chatbot & Direct Audio Voice Command)
export interface AiReportDraft {
  category: IncidentCategory;
  customCategoryName?: string;
  description: string;
}

export interface AiAssistantResponse {
  action: 'create_report' | 'open_my_reports' | 'navigate' | 'toggle_elderly' | 'chat_reply';
  reply: string;
  transcript?: string;
  reportDraft?: AiReportDraft;
  route?: string;
  elderlyEnabled?: boolean;
  analyzedBy: 'gemini' | 'fallback';
}

export const aiApi = {
  assistant: (
    message: string,
    mode: 'chat' | 'voice' = 'chat',
    history: { role: 'user' | 'assistant'; text: string }[] = []
  ) =>
    apiRequest<AiAssistantResponse>('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ message, mode, history }),
    }),
  voiceCommand: (audioBlob: Blob) => {
    const formData = new FormData();
    const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    formData.append('audio', audioBlob, `voice-command.${ext}`);
    return apiRequest<AiAssistantResponse>('/ai/voice-command', {
      method: 'POST',
      body: formData,
    });
  },
};

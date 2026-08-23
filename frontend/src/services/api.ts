import {
  ScanResponse,
  ImportPreviewResponse,
  ImportConfirmResponse,
  DashboardStats,
} from '../types';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    (window as any).Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port === '')
  );
}

export function getApiBaseUrl(): string {
  const env = (import.meta as any).env;
  if (env && env.VITE_API_URL) {
    const envUrl = (env.VITE_API_URL as string).trim().replace(/\/+$/, '');
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  return 'https://graduation-day-backend-yy69.onrender.com/api';
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    throw new Error(
      'Unable to connect to the orientation portal service. Please check your internet connection and try again.'
    );
  }
}

async function handleResponse(res: Response, fallbackErrorMessage: string) {
  let text = '';
  try {
    text = await res.text();
  } catch (err: any) {
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText || fallbackErrorMessage}`);
    }
    return { status: 'OK' };
  }

  // Attempt JSON parse
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (data !== null) {
    if (!res.ok) {
      throw new Error(data.message || data.error || fallbackErrorMessage);
    }
    return data;
  }

  if (!res.ok) {
    throw new Error(
      `Request failed (${res.status}): ${text.slice(0, 120).trim() || res.statusText || fallbackErrorMessage}`
    );
  }

  return { status: 'OK', message: text.trim() || 'OK' };
}

export const api = {
  isNative: isNativePlatform,

  // Auth
  login: async (username: string, password: string) => {
    const res = await safeFetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res, 'Login failed. Please check credentials.');
  },

  studentLogin: async (studentId: string, password?: string) => {
    const res = await safeFetch(`${getApiBaseUrl()}/candidate/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password: password || studentId }),
    });
    return handleResponse(res, 'Student login failed.');
  },

  me: async () => {
    const res = await safeFetch(`${getApiBaseUrl()}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to verify admin session.');
  },

  // Candidate Verification & Registration
  verifyCandidate: async (studentId: string) => {
    const res = await safeFetch(`${getApiBaseUrl()}/candidates/verify/${encodeURIComponent(studentId)}`);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.status === 403) return data;
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      return data;
    }
    throw new Error(`Server error (${res.status}) during candidate verification.`);
  },

  registerCandidate: async (studentId: string, eventId?: string) => {
    const res = await safeFetch(`${getApiBaseUrl()}/candidates/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, eventId }),
    });
    return handleResponse(res, 'Registration pass generation failed.');
  },

  // Admin Candidate Import Engine
  uploadPreview: async (file: File): Promise<ImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await safeFetch(`${getApiBaseUrl()}/admin/import/preview`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse(res, 'Failed to preview import file.');
  },

  confirmImport: async (previewRows: any[], filename: string): Promise<ImportConfirmResponse> => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/import/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ previewRows, filename }),
    });
    return handleResponse(res, 'Import confirmation failed.');
  },

  // Candidates Directory
  getCandidates: async (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${getApiBaseUrl()}/admin/candidates?${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to load candidate list.');
  },

  // Import History
  getImportLogs: async (): Promise<any[]> => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/import/history`, {
      headers: { ...getAuthHeader() },
    });
    const data = await handleResponse(res, 'Failed to fetch import logs');
    return data.logs || [];
  },

  // QR Scanning Engine
  scanToken: async (token: string, scanMode?: string): Promise<ScanResponse> => {
    const res = await safeFetch(`${getApiBaseUrl()}/attendance/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ token, scanMode: scanMode || 'attendance' }),
    });
    return handleResponse(res, 'Scan verification failed.');
  },

  // Live Attendance
  getAttendanceLogs: async (params?: Record<string, string>): Promise<AttendanceListResponse> => {
    const query = new URLSearchParams(params).toString();
    const res = await safeFetch(`${getApiBaseUrl()}/admin/attendance?${query}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to load attendance logs.');
  },

  exportAttendanceCSV: async () => {
    const res = await safeFetch(`${getApiBaseUrl()}/attendance/export-csv`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to export CSV report');
    const blob = await res.blob();
    return {
      blob,
      filename: `Orientation-Day-2026-Attendance-${new Date().toISOString().split('T')[0]}.csv`,
    };
  },

  resetAttendance: async () => {
    const res = await safeFetch(`${getApiBaseUrl()}/attendance/reset`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to reset attendance.');
  },

  // Events & Ceremony Events Management
  getEvents: async () => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/events`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to fetch events.');
  },

  createEvent: async (eventData: { name: string; slug: string; description?: string; requiresPayment?: boolean }) => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(eventData),
    });
    return handleResponse(res, 'Failed to create event.');
  },

  updateEvent: async (id: string, updateData: { name?: string; description?: string; isActive?: boolean; requiresPayment?: boolean }) => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(res, 'Failed to update event.');
  },

  getEventStats: async (id: string) => {
    const res = await safeFetch(`${getApiBaseUrl()}/admin/events/${id}/stats`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res, 'Failed to fetch event stats.');
  },

  // Dashboard Live Analytics
  getDashboardStats: async (college?: string): Promise<DashboardStats & { programBreakdown: any[]; collegeBreakdown?: any[]; availableColleges?: string[] }> => {
    const query = college && college !== 'all' ? `?college=${encodeURIComponent(college)}` : '';
    const res = await safeFetch(`${getApiBaseUrl()}/admin/dashboard/stats${query}`, {
      headers: { ...getAuthHeader() },
    });
    const data = await handleResponse(res, 'Failed to fetch dashboard stats.');
    return data.stats || data;
  },
};

import type { Shift, ShiftFormData } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

export async function fetchShifts(token: string): Promise<Shift[]> {
  return request<Shift[]>('/api/shifts', token);
}

export async function createShift(token: string, form: ShiftFormData): Promise<Shift> {
  return request<Shift>('/api/shifts', token, {
    method: 'POST',
    body: JSON.stringify({
      workplace: form.workplace.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      hourlyRate: Number(form.hourlyRate),
      breakMinutes: Number(form.breakMinutes),
    }),
  });
}

export async function updateShift(token: string, id: string, form: ShiftFormData): Promise<Shift> {
  return request<Shift>(`/api/shifts/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      workplace: form.workplace.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      hourlyRate: Number(form.hourlyRate),
      breakMinutes: Number(form.breakMinutes),
    }),
  });
}

export async function deleteShift(token: string, id: string): Promise<void> {
  await request(`/api/shifts/${id}`, token, { method: 'DELETE' });
}

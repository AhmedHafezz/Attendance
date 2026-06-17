import { apiRequest } from './client';
import type { AttendanceHistoryItem, AttendanceSummaryItem, PunchResponse, PunchType } from '../types';

interface PunchPayload {
  punchType: PunchType;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export function punch(payload: PunchPayload) {
  return apiRequest<PunchResponse>('/attendance/punch', {
    method: 'POST',
    body: payload,
  });
}

export function getHistory(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiRequest<AttendanceHistoryItem[]>(`/attendance/history${query ? `?${query}` : ''}`);
}

export function getSummary(year: number, month: number) {
  return apiRequest<AttendanceSummaryItem[]>(`/attendance/summary?year=${year}&month=${month}`);
}

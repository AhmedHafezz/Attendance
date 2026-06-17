import { apiRequest } from './client';
import type { VisitorItem } from '../types';

interface CreateVisitorPayload {
  branchId: number;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  hostEmployeeId?: number;
  purpose?: string;
  badgeNumber?: string;
}

export function getVisitors(params: { branchId?: number; activeOnly?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.branchId) search.set('branchId', String(params.branchId));
  if (params.activeOnly) search.set('activeOnly', 'true');
  const query = search.toString();
  return apiRequest<VisitorItem[]>(`/visitors${query ? `?${query}` : ''}`);
}

export function checkInVisitor(payload: CreateVisitorPayload) {
  return apiRequest<VisitorItem>('/visitors', { method: 'POST', body: payload });
}

export function checkOutVisitor(id: number) {
  return apiRequest<VisitorItem>(`/visitors/${id}/checkout`, { method: 'PUT' });
}

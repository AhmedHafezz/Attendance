import { apiRequest } from './client';
import type { EmployeeListItem, EmployeeRoleValue } from '../types';

interface CreateEmployeePayload {
  branchId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: EmployeeRoleValue;
}

interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  branchId?: number;
  role?: EmployeeRoleValue;
  isActive?: boolean;
}

export function getEmployees(params: { branchId?: number; isActive?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.branchId) search.set('branchId', String(params.branchId));
  if (params.isActive !== undefined) search.set('isActive', String(params.isActive));
  const query = search.toString();
  return apiRequest<EmployeeListItem[]>(`/employees${query ? `?${query}` : ''}`);
}

export function createEmployee(payload: CreateEmployeePayload) {
  return apiRequest<EmployeeListItem>('/employees', { method: 'POST', body: payload });
}

export function updateEmployee(id: number, payload: UpdateEmployeePayload) {
  return apiRequest<EmployeeListItem>(`/employees/${id}`, { method: 'PUT', body: payload });
}

export function deactivateEmployee(id: number) {
  return apiRequest<void>(`/employees/${id}`, { method: 'DELETE' });
}

export enum PunchType {
  CheckIn = 0,
  CheckOut = 1,
}

export type EmployeeRole = 'Employee' | 'Manager' | 'Admin';

// EmployeeDto.Role on the API serializes the C# enum as a number (no string
// enum converter is configured), unlike LoginResponse.Role which is a plain string.
export enum EmployeeRoleValue {
  Employee = 0,
  Manager = 1,
  Admin = 2,
}

export const EMPLOYEE_ROLE_LABEL: Record<EmployeeRoleValue, EmployeeRole> = {
  [EmployeeRoleValue.Employee]: 'Employee',
  [EmployeeRoleValue.Manager]: 'Manager',
  [EmployeeRoleValue.Admin]: 'Admin',
};

export interface EmployeeInfo {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  role: EmployeeRole;
  profileImageUrl?: string | null;
  companyId: number;
  branchId: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  employee: EmployeeInfo;
}

export interface PunchResponse {
  id: number;
  punchType: PunchType;
  punchTime: string;
  message?: string | null;
}

export interface AttendanceHistoryItem {
  id: number;
  employeeName: string;
  employeeCode: string;
  punchType: PunchType;
  punchTime: string;
  latitude?: number | null;
  longitude?: number | null;
  source: string;
  notes?: string | null;
  branchName: string;
}

export interface AttendanceSummaryItem {
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  duration?: string | null;
  status: 'Complete' | 'Open' | 'Absent';
}

export interface VisitorItem {
  id: number;
  branchId: number;
  branchName: string;
  visitorName: string;
  visitorPhone?: string | null;
  visitorEmail?: string | null;
  hostEmployeeName?: string | null;
  purpose?: string | null;
  checkInTime: string;
  checkOutTime?: string | null;
  badgeNumber?: string | null;
  isCheckedOut: boolean;
}

export interface EmployeeListItem {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: EmployeeRoleValue;
  profileImageUrl?: string | null;
  isActive: boolean;
  companyId: number;
  companyName: string;
  branchId: number;
  branchName: string;
  createdAt: string;
}

export interface BranchItem {
  id: number;
  companyId: number;
  companyName: string;
  name: string;
  code: string;
  address?: string | null;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

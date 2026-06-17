export enum PunchType {
  CheckIn = 0,
  CheckOut = 1,
}

export type EmployeeRole = 'Employee' | 'Manager' | 'Admin';

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
  isValid: boolean;
  locationValidated: boolean;
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
  isValid: boolean;
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

export interface ApiErrorBody {
  statusCode?: number;
  message?: string;
  errors?: Record<string, string[]>;
}

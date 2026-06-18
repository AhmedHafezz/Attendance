import { apiRequest } from './client';
import type { BranchItem } from '../types';

export function getBranches() {
  return apiRequest<BranchItem[]>('/branches');
}

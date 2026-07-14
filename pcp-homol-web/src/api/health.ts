import { apiFetch } from './http';

export function fetchHealth() {
  return apiFetch<{
    status: string;
    database: string;
    timestamp: string;
  }>('/api/health');
}

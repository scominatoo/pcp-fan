import { apiFetch } from './http';

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: { username: string; role: string };
};

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe() {
  return apiFetch<{ username: string; role: string }>('/api/auth/me');
}

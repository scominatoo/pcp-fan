/** Em dev usa proxy do Vite (`/api`); em produção usa VITE_API_URL. */
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL ?? '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      const raw = body.message ?? message;
      message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

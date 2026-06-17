import { API_BASE_URL } from './config';
import type { ApiErrorBody } from '../types';

type RefreshHandler = () => Promise<string | null>;
type SessionExpiredHandler = () => void;

let accessToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function configureApiClient(opts: {
  onRefresh: RefreshHandler;
  onSessionExpired: SessionExpiredHandler;
}) {
  refreshHandler = opts.onRefresh;
  sessionExpiredHandler = opts.onSessionExpired;
}

export class ApiError extends Error {
  statusCode: number;
  body?: ApiErrorBody;

  constructor(statusCode: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  headers?: Record<string, string>;
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, authenticated = true, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authenticated && accessToken) {
    finalHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? response.statusText, payload);
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    const isAuthFailure = err instanceof ApiError && err.statusCode === 401;
    if (isAuthFailure && options.authenticated !== false && refreshHandler) {
      const newToken = await refreshHandler();
      if (newToken) {
        accessToken = newToken;
        return rawRequest<T>(path, options);
      }
      sessionExpiredHandler?.();
    }
    throw err;
  }
}

import { toast } from 'sonner';
import { ApiError } from './api-error';

let isRefreshing = false;
let refreshPromise: Promise<void> | Promise<any> | null = null;

export const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body instanceof URLSearchParams === false && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (endpoint === '/auth/refresh' || endpoint === '/auth/login' || endpoint === '/auth/verify-login' || endpoint === '/auth/register' || endpoint === '/auth/verify-signup') {
      return response;
    }

    if (isRefreshing) {
      await refreshPromise;
      return fetchApi(endpoint, options);
    }

    isRefreshing = true;
    refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      isRefreshing = false;
      refreshPromise = null;
      return fetchApi(endpoint, options);
    }).catch((err) => {
      isRefreshing = false;
      refreshPromise = null;
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      throw err;
    });

    return refreshPromise;
  }

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let details: any;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      details = errorData.details || errorData;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    const apiError = new ApiError(response.status, errorMessage, endpoint, details);

    if (response.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (response.status === 404) {
      toast.error('Resource not found.');
    } else if (response.status === 409) {
      toast.error(errorMessage);
    } else if (response.status !== 401) {
      toast.error(errorMessage);
    }

    throw apiError;
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public path?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const AuthStorage = {
  clear: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qmover_auth_token');
    }
  },
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type') && options.body instanceof URLSearchParams === false && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorDetails = null;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;
      } catch (e) {
        errorMessage = response.statusText;
      }
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint} → ${response.status}: ${errorMessage}`, errorDetails);
      throw new ApiError(response.status, errorMessage, endpoint, errorDetails);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`[API Timeout] ${options.method || 'GET'} ${endpoint} → Request timed out after 30s`);
      throw new ApiError(408, 'Request timed out. Please try again.', endpoint);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`[API Network Error] ${options.method || 'GET'} ${endpoint} → ${error.message}`, error);
    throw new ApiError(0, error.message || 'Network error', endpoint);
  }
};

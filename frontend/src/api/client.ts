import { env } from '@/config/env';
import { ApiResponse, ApiError } from '@/types/api';
import { handleMockRequest } from './mock/mockAdapter';

// Latency listener system for X-Response-Time tracking
type LatencyListener = (latencyMs: number) => void;
const latencyListeners: Set<LatencyListener> = new Set();

export function subscribeLatency(listener: LatencyListener): () => void {
  latencyListeners.add(listener);
  return () => {
    latencyListeners.delete(listener);
  };
}

function notifyLatency(latencyMs: number) {
  latencyListeners.forEach((listener) => listener(latencyMs));
}

export class HttpClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, code = 'HTTP_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'HttpClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If mock mode is enabled, intercept with development mock adapter
  if (env.VITE_USE_MOCK_API) {
    try {
      const mockRes = await handleMockRequest<T>(normalizedEndpoint, options);
      notifyLatency(mockRes.latencyMs);
      return {
        success: true,
        data: mockRes.data,
        latencyMs: mockRes.latencyMs,
      };
    } catch (err) {
      throw new HttpClientError(
        err instanceof Error ? err.message : 'Mock request error',
        'MOCK_ERROR',
        500
      );
    }
  }

  // Real backend request
  const url = `${env.VITE_API_BASE_URL}${normalizedEndpoint}`;
  const startTime = performance.now();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Enforce secure HTTP-only cookies
    });

    const endTime = performance.now();

    // Extract X-Response-Time header or calculate client round-trip
    const xResponseTime = response.headers.get('x-response-time');
    let latencyMs = Math.round(endTime - startTime);
    if (xResponseTime) {
      const parsedHeader = parseFloat(xResponseTime);
      if (!isNaN(parsedHeader)) {
        latencyMs = Math.round(parsedHeader);
      }
    }

    notifyLatency(latencyMs);

    if (!response.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = (await response.json()) as ApiError;
      } catch {
        // Fallback for non-JSON errors
      }

      throw new HttpClientError(
        errorData?.error?.message || `Request failed with status ${response.status}`,
        errorData?.error?.code || 'API_ERROR',
        response.status,
        errorData?.error?.details
      );
    }

    const json = (await response.json()) as ApiResponse<T>;
    return {
      ...json,
      latencyMs,
    };
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Network communication error';
    throw new HttpClientError(message, 'NETWORK_ERROR', 0);
  }
}

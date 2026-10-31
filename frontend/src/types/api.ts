export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  latencyMs?: number;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}


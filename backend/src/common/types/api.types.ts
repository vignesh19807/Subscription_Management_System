export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  requestId?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

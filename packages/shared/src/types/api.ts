export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  environment: string;
  timestamp: string;
}

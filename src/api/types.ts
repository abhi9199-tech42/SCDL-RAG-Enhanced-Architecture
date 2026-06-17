export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    latencyMs?: number;
  };
}

export interface IngestRequest {
  id: string;
  content: string;
  metadata?: any;
}

export interface RetrieveRequest {
  query: string;
  limit?: number;
}

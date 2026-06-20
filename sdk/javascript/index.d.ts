declare module 'scdl-rag' {
  interface DetectParams {
    question: string;
    answer: string;
    documents: Array<{ id: string; content: string; title?: string }>;
    model?: string;
  }
  interface DetectResult {
    request_id: string;
    hallucination_detected: boolean;
    mu_score: number;
    precision: number;
    status: string;
    signals: { nli_score: number; lexical_match: number; entity_overlap: number };
    explanation: string;
    processing_time_ms: number;
  }
  interface DetectAndFixParams {
    question: string;
    answer: string;
    documents: Array<{ id: string; content: string; title?: string }>;
    documentPool?: Array<{ id: string; content: string; title?: string }>;
    autoFix?: boolean;
  }
  interface DetectAndFixResult {
    request_id: string;
    hallucination_detected: boolean;
    mu_score_initial: number;
    status_initial: string;
    fix_attempted: boolean;
    fix_success: boolean;
    mu_score_after_fix: number;
    status_after_fix: string;
    improved_answer: string;
    confidence: number;
    processing_time_ms: number;
  }
  interface BatchParams {
    cases: Array<{ id: string; question: string; answer: string; documents: Array<{ id: string; content: string; title?: string }> }>;
    autoFix?: boolean;
    batchId?: string;
  }
  interface BatchResult {
    batch_id: string;
    total_cases: number;
    processed: number;
    results: Array<any>;
    summary: { hallucinations_found: number; fixes_successful: number; accuracy_improvement: string };
    processing_time_ms: number;
  }
  class Client {
    constructor(config: { apiKey: string; baseURL?: string });
    detect(params: DetectParams): Promise<DetectResult>;
    detectAndFix(params: DetectAndFixParams): Promise<DetectAndFixResult>;
    batchDetectAndFix(params: BatchParams): Promise<BatchResult>;
    health(): Promise<{ status: string; uptime: string; version: string; models_loaded: boolean }>;
  }
  export { Client };
}

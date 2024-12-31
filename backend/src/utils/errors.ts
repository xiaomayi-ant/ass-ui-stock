export class AppError extends Error {
  public readonly context: any;
  public readonly step: string;
  public readonly timestamp: string;

  constructor(message: string, step: string, context?: any) {
    super(message);
    this.name = 'AppError';
    this.step = step;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      step: this.step,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export const ErrorStep = {
  MILVUS_CONNECTION: 'milvus_connection',
  MILVUS_SEARCH: 'milvus_search',
  EMBEDDING_GENERATION: 'embedding_generation',
  LLM_CALL: 'llm_call',
  TOOL_EXECUTION: 'tool_execution',
  MESSAGE_PARSING: 'message_parsing',
  API_REQUEST: 'api_request'
} as const;

export type ErrorStep = typeof ErrorStep[keyof typeof ErrorStep]; 
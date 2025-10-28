export interface ResponseFormat {
  readonly type: 'json_schema';
  readonly json_schema: {
    readonly name: string;
    readonly strict: boolean;
    readonly schema: Record<string, unknown>;
  };
}

export interface Message {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export interface OpenRouterRequest {
  readonly model: string;
  readonly messages: Message[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface OpenRouterResponse {
  readonly id: string;
  readonly choices: Array<{
    readonly message: {
      readonly role: string;
      readonly content: string;
    };
    readonly finish_reason: string;
  }>;
  readonly usage: {
    readonly prompt_tokens: number;
    readonly completion_tokens: number;
    readonly total_tokens: number;
  };
}

export interface StructuredResponse<T = Record<string, unknown>> {
  readonly data: T;
  readonly usage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

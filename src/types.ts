export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
    enum?: Array<string | number | null>;
    default?: string | number | boolean | null;
  };
}

export interface OpenApiOperation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: Record<string, { schema?: any }>;
  };
}

export interface ParsedEndpoint {
  method: HttpMethod;
  path: string;
  tag: string;
  operation: OpenApiOperation;
}

export interface RequestState {
  operationId: string;
  pathParams: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: Record<string, unknown>;
  rawBody: string;
}

export interface ResponseState {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  elapsedMs: number;
}

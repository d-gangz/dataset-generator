export type ActionState<T> =
  | { isSuccess: true; message: string; data: T }
  | { isSuccess: false; message: string; data?: never };

export interface GenerateRequest {
  prompt: string;
  zodSchemaText: string;
}

export interface GenerateResponse {
  csv: string;
  data: Record<string, unknown>[];
}

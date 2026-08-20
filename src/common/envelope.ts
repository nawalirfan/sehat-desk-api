export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Envelope<T> {
  data: T | null;
  error: ApiError | null;
}

export function ok<T>(data: T): Envelope<T> {
  return { data, error: null };
}

// Only called from the exception filter, controllers just return plain data.
export function fail(code: string, message: string, details?: unknown): Envelope<null> {
  return { data: null, error: { code, message, details } };
}

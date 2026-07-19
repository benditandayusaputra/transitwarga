/** Format error seragam (blueprint 6.1): { error: { code, message } }. */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ApiErrorCode =
  'INVALID_INPUT' | 'TURNSTILE_FAILED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'UPSTREAM_ERROR';

export const ERROR_STATUS: Record<ApiErrorCode, ContentfulStatusCode> = {
  INVALID_INPUT: 400,
  TURNSTILE_FAILED: 401,
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 503,
  UPSTREAM_ERROR: 502
};

export function apiError(c: Context, code: ApiErrorCode, message: string): Response {
  return c.json({ error: { code, message } }, ERROR_STATUS[code]);
}

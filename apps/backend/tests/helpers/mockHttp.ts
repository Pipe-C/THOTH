import { vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface MockHttpContext {
  req: VercelRequest;
  res: VercelResponse;
  state: {
    statusCode: number;
    body: any;
    headers: Record<string, string>;
  };
}

export function createMockHttp(
  method: string,
  body: Record<string, unknown> = {},
): MockHttpContext {
  const state = {
    statusCode: 200,
    body: null as any,
    headers: {} as Record<string, string>,
  };

  const req = {
    method,
    body,
  } as unknown as VercelRequest;

  const res = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return res;
    }),
    setHeader: vi.fn((name: string, value: string) => {
      state.headers[name] = value;
      return res;
    }),
    json: vi.fn((data: unknown) => {
      state.body = data;
      return res;
    }),
  } as unknown as VercelResponse;

  return { req, res, state };
}

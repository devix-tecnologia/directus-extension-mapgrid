import axios from 'axios';

export const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface DirectusCollectionResponse<Item> {
  data: Item[];
}

export interface DirectusSingleResponse<Item> {
  data: Item;
}

export interface DirectusHealth {
  status: string;
}

export const unwrapItems = <Item>(response: DirectusCollectionResponse<Item>): Item[] =>
  response.data;

export class DirectusApiError extends Error {
  constructor(
    readonly method: HttpMethod,
    readonly path: string,
    readonly status: number,
    message: string
  ) {
    super(`API ${method} ${path} failed with HTTP ${status}: ${message}`);
    this.name = 'DirectusApiError';
  }
}

interface DirectusErrorBody {
  errors?: Array<{ message?: unknown }>;
}

const extractDirectusErrorMessage = (body: unknown): string => {
  const firstMessage = (body as DirectusErrorBody)?.errors?.[0]?.message;
  return typeof firstMessage === 'string' ? firstMessage : JSON.stringify(firstMessage ?? body);
};

let accessToken: string | undefined;

export const setAccessToken = (token: string): void => {
  accessToken = token;
};

export const getAccessToken = (): string => {
  if (!accessToken) {
    throw new Error(
      'Access token requested before authentication. Call setupTestEnvironment() first.'
    );
  }
  return accessToken;
};

const authorizedHeaders = (token?: string): Record<string, string> =>
  token || accessToken ? { Authorization: `Bearer ${token ?? accessToken}` } : {};

export async function apiRequest<Response>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  token?: string
): Promise<Response> {
  const response = await axios.request<Response>({
    method,
    url: `${DIRECTUS_URL}${path}`,
    data: body,
    headers: authorizedHeaders(token),
    timeout: 30_000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new DirectusApiError(
      method,
      path,
      response.status,
      extractDirectusErrorMessage(response.data)
    );
  }

  return response.data;
}

export const resourceExists = async (path: string): Promise<boolean> => {
  const response = await axios.get(`${DIRECTUS_URL}${path}`, {
    headers: authorizedHeaders(),
    timeout: 30_000,
    validateStatus: () => true,
  });
  return response.status === 200;
};

export const isDirectusHealthy = async (): Promise<boolean> => {
  try {
    const health = await apiRequest<DirectusHealth>('GET', '/server/health');
    return health.status === 'ok';
  } catch {
    return false;
  }
};

import { API_PREFIX, apiBaseUrl, DEFAULT_TIMEOUT_MS, isCrossOriginApi } from "../env";
import { ApiError, type ApiErrorBody } from "./api-error";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Path below `/api/v1`, starting with `/`. */
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** `none` for 204 responses, `blob` for report and digest documents. */
  as?: "json" | "blob" | "none";
  /** Set false where the caller handles 401 itself (wrong password on reauth). */
  handleUnauthorized?: boolean;
};

type Plan = { url: string; init: RequestInit; request: ApiRequest };
export type RequestInterceptor = (plan: Plan) => Plan;
export type ResponseInterceptor = (response: Response, request: ApiRequest) => void;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function addRequestInterceptor(fn: RequestInterceptor): () => void {
  requestInterceptors.push(fn);
  return () => void requestInterceptors.splice(requestInterceptors.indexOf(fn), 1);
}
export function addResponseInterceptor(fn: ResponseInterceptor): () => void {
  responseInterceptors.push(fn);
  return () => void responseInterceptors.splice(responseInterceptors.indexOf(fn), 1);
}

/** Called on every 401. The session provider registers the cache reset and the redirect to `/login` here. */
let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function buildUrl(path: string, query?: QueryParams): string {
  const url = `${apiBaseUrl()}${API_PREFIX}${path}`;
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `${url}?${text}` : url;
}

// The session lives in an HttpOnly cookie that only the browser sends; no token is ever read or stored here.
const baseInterceptor: RequestInterceptor = (plan) => {
  const headers = new Headers(plan.init.headers);
  headers.set("Accept", plan.request.as === "blob" ? "*/*" : "application/json");
  if (plan.request.body !== undefined) headers.set("Content-Type", "application/json");
  return {
    ...plan,
    init: {
      ...plan.init,
      headers,
      credentials: isCrossOriginApi() ? "include" : "same-origin",
      cache: "no-store",
    },
  };
};

function toError(response: Response, body: unknown): ApiError {
  const detail = ((body as ApiErrorBody | null)?.error ?? {}) as Record<string, unknown>;
  const { code, message, trace_id: traceId, ...extra } = detail;
  const retry = Number(response.headers.get("Retry-After"));
  return new ApiError(
    typeof message === "string" ? message : "",
    response.status,
    typeof code === "string" ? code : undefined,
    typeof traceId === "string" ? traceId : undefined,
    Number.isFinite(retry) && retry > 0 ? retry : undefined,
    Object.keys(extra).length ? extra : undefined,
  );
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Sends one request to the Astria api and returns the parsed body, or throws a normalized `ApiError`. */
export async function apiRequest<T>(request: ApiRequest): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException("timeout", "TimeoutError")),
    request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const onAbort = () => controller.abort(request.signal?.reason);
  request.signal?.addEventListener("abort", onAbort, { once: true });
  try {
    let plan: Plan = {
      url: buildUrl(request.path, request.query),
      request,
      init: {
        method: request.method ?? "GET",
        redirect: "error",
        signal: controller.signal,
        headers: request.headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
      },
    };
    for (const fn of [baseInterceptor, ...requestInterceptors]) plan = fn(plan);
    const response = await fetch(plan.url, plan.init);
    for (const fn of responseInterceptors) fn(response, request);
    if (!response.ok) {
      const error = toError(response, await readBody(response));
      if (response.status === 401 && request.handleUnauthorized !== false) unauthorizedHandler?.();
      throw error;
    }
    if (request.as === "none" || response.status === 204) return undefined as T;
    if (request.as === "blob") return (await response.blob()) as T;
    const body = await readBody(response);
    if (body === null) throw new ApiError("", response.status, "RESPON_TIDAK_VALID");
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (request.signal?.aborted) throw error; // The caller cancelled; TanStack Query ignores this.
    if (controller.signal.aborted) throw new ApiError("", undefined, "TIMEOUT");
    throw new ApiError("", undefined, "NETWORK");
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener("abort", onAbort);
  }
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) => apiRequest<T>({ path, query, signal }),
  post: <T>(path: string, body?: unknown, options: Partial<ApiRequest> = {}) =>
    apiRequest<T>({ ...options, method: "POST", path, body }),
  put: <T>(path: string, body?: unknown, options: Partial<ApiRequest> = {}) =>
    apiRequest<T>({ ...options, method: "PUT", path, body }),
  patch: <T>(path: string, body?: unknown, options: Partial<ApiRequest> = {}) =>
    apiRequest<T>({ ...options, method: "PATCH", path, body }),
  delete: (path: string, options: Partial<ApiRequest> = {}) =>
    apiRequest<void>({ ...options, method: "DELETE", path, as: "none" }),
};

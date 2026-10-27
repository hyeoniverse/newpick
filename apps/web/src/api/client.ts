import { API_ENDPOINTS } from '@/constants/api';

/**
 * API가 실패 응답을 보냈을 때. API의 오류 응답은 늘 { statusCode, code, message, details? } 모양이라
 * status(HTTP 상태)나 code(예: NEWSLETTER_NOT_FOUND)로 분기하고, message는 사용자에게 그대로 보여 줘도 된다
 */
export class ApiError extends Error {
	/** API 오류 code. 응답이 JSON이 아니면(프록시 오류 등) 없음 */
	public readonly code?: string;

	constructor(
		public readonly status: number,
		message: string,
		public readonly body?: unknown,
	) {
		super(message);
		this.name = 'ApiError';
		const code = (body as { code?: unknown } | undefined)?.code;
		if (typeof code === 'string') this.code = code;
	}
}

type ApiOptions = Omit<RequestInit, 'body'> & {
	/** 객체를 넘기면 JSON으로 보냅니다. */
	body?: unknown;
	/** 401일 때 토큰 갱신 후 한 번 다시 시도할지 (브라우저에서만, 기본 true) */
	retryOnUnauthorized?: boolean;
};

let refreshing: Promise<boolean> | null = null;

/** 동시에 여러 요청이 401을 받아도 refresh는 한 번만 보냅니다. */
function refreshSession(): Promise<boolean> {
	refreshing ??= fetch(API_ENDPOINTS.AUTH.REFRESH(), { credentials: 'include' })
		.then((response) => response.ok)
		.catch(() => false)
		.finally(() => {
			refreshing = null;
		});
	return refreshing;
}

async function send(url: string, { body, headers, ...init }: ApiOptions) {
	const isJson = body !== undefined && !(body instanceof FormData);
	return fetch(url, {
		credentials: 'include',
		...init,
		headers: {
			Accept: 'application/json',
			...(isJson && { 'Content-Type': 'application/json' }),
			...headers,
		},
		body: isJson ? JSON.stringify(body) : (body as BodyInit | undefined),
	});
}

async function errorMessage(response: Response): Promise<{ message: string; body?: unknown }> {
	try {
		const body = await response.json();
		const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
		return { message: message || response.statusText, body };
	} catch {
		return { message: response.statusText };
	}
}

/**
 * 모든 API 요청의 공통 경로.
 * - 브라우저: /api/* (Next rewrites 프록시) → 쿠키가 프론트 도메인에 저장됩니다.
 * - 서버: API_URL로 백엔드를 직접 호출합니다. (서버에서의 토큰 갱신은 middleware가 담당)
 */
export async function apiFetch<T = unknown>(url: string, options: ApiOptions = {}): Promise<T> {
	const { retryOnUnauthorized = true } = options;
	let response = await send(url, options);

	if (
		response.status === 401 &&
		retryOnUnauthorized &&
		typeof window !== 'undefined' &&
		url !== API_ENDPOINTS.AUTH.REFRESH() &&
		(await refreshSession())
	) {
		response = await send(url, options);
	}

	if (!response.ok) {
		const { message, body } = await errorMessage(response);
		throw new ApiError(response.status, message, body);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return (text ? JSON.parse(text) : undefined) as T;
}

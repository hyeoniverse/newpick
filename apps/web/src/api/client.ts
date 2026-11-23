import { type ErrorCode, isErrorCode } from '@newpick/shared';
import { API_ENDPOINTS } from '@/constants/api';

/**
 * API가 실패 응답을 보냈을 때. API의 오류 응답은 늘 { statusCode, code, message, details? } 모양이라
 * status(HTTP 상태)나 code(예: NEWSLETTER_NOT_FOUND)로 분기하고, message는 사용자에게 그대로 보여 줘도 된다
 */
export class ApiError extends Error {
	/** API 오류 code (@newpick/shared의 이름). 응답이 JSON이 아니거나(프록시 오류 등) 모르는 code면 없음 */
	public readonly code?: ErrorCode;

	constructor(
		public readonly status: number,
		message: string,
		public readonly body?: unknown,
	) {
		super(message);
		this.name = 'ApiError';
		const code = (body as { code?: unknown } | undefined)?.code;
		if (isErrorCode(code)) this.code = code;
	}
}

/** 알릴 오류 문구: api가 준 문구가 있으면 그것, 없으면(네트워크 · 프록시 오류 등) fallback */
export const errorMessage = (error: unknown, fallback: string) =>
	error instanceof ApiError ? error.message : fallback;

type ApiOptions = Omit<RequestInit, 'body'> & {
	/** 객체를 넘기면 JSON으로 보냅니다. */
	body?: unknown;
	/** 401일 때 토큰 갱신 후 한 번 다시 시도할지 (브라우저에서만, 기본 true) */
	retryOnUnauthorized?: boolean;
};

/**
 * 서버(page · layout · route)에서 api를 기다리는 기본 최대 시간. 넘으면 오류로 끝내 각 화면의 오류 처리로 간다.
 * 예전에는 시간 제한이 없어 api가 응답 없이 멈추면 서버 렌더링도 같이 멈췄다 (#340). signal을 주면 그것을 쓴다
 */
const SERVER_TIMEOUT_MS = 5000;

/** ok: 새 토큰 받음 · expired: 로그인이 끝남 · unknown: api에 닿지 못했거나 5xx (로그인이 끝났는지 모름) */
type RefreshOutcome = 'ok' | 'expired' | 'unknown';

let refreshing: Promise<RefreshOutcome> | null = null;

/** 동시에 여러 요청이 401을 받아도 refresh는 한 번만 보냅니다. */
function refreshSession(): Promise<RefreshOutcome> {
	refreshing ??= fetch(API_ENDPOINTS.AUTH.REFRESH(), { credentials: 'include' })
		.then((response): RefreshOutcome => (response.ok ? 'ok' : response.status >= 500 ? 'unknown' : 'expired'))
		.catch((): RefreshOutcome => 'unknown')
		.finally(() => {
			refreshing = null;
		});
	return refreshing;
}

async function send(url: string, { body, headers, ...init }: ApiOptions) {
	const isJson = body !== undefined && !(body instanceof FormData);
	return fetch(url, {
		credentials: 'include',
		...(typeof window === 'undefined' && { signal: AbortSignal.timeout(SERVER_TIMEOUT_MS) }),
		...init,
		headers: {
			Accept: 'application/json',
			...(isJson && { 'Content-Type': 'application/json' }),
			...headers,
		},
		body: isJson ? JSON.stringify(body) : (body as BodyInit | undefined),
	});
}

async function readError(response: Response): Promise<{ message: string; body?: unknown }> {
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
 * - 응답을 쓰려면 타입을 적는다 (apiFetch<{ data: Newsletter }>). 적지 않으면 void라 응답을 쓸 수 없다
 *   (보내기만 하는 POST · DELETE용, 응답 모양을 모른 채 쓰지 않게)
 */
export async function apiFetch<T = void>(url: string, options: ApiOptions = {}): Promise<T> {
	const { retryOnUnauthorized = true } = options;
	let response = await send(url, options);

	if (
		response.status === 401 &&
		retryOnUnauthorized &&
		typeof window !== 'undefined' &&
		url !== API_ENDPOINTS.AUTH.REFRESH()
	) {
		const outcome = await refreshSession();
		if (outcome === 'ok') response = await send(url, options);
		// 갱신하러 api에 닿지 못했으면 401(로그인 끝남)이 아니라 503으로 알린다: 화면이 로그아웃 상태로 바뀌지 않게 (#340)
		else if (outcome === 'unknown') throw new ApiError(503, 'Service Unavailable');
	}

	if (!response.ok) {
		const { message, body } = await readError(response);
		throw new ApiError(response.status, message, body);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return (text ? JSON.parse(text) : undefined) as T;
}

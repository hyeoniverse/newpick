import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { ERROR_STATES, errorStateFor, statusOf } from '@/constants/errors';

describe('statusOf', () => {
	it('ApiError는 status를 쓴다', () => {
		expect(statusOf(new ApiError(404, 'Newsletter not found'))).toBe(404);
	});

	it('그 밖의 오류는 메시지 속 4xx·5xx 숫자를 찾는다', () => {
		expect(statusOf(new Error('Request failed with 429'))).toBe(429);
	});

	it('숫자가 없거나 오류가 아니면 500', () => {
		expect(statusOf(new TypeError('Failed to fetch'))).toBe(500);
		expect(statusOf('boom')).toBe(500);
	});
});

describe('errorStateFor', () => {
	it('표에 있는 코드는 그 문구', () => {
		expect(errorStateFor(503)).toBe(ERROR_STATES[503]);
		expect(errorStateFor(401).action).toBe('login');
	});

	it('표에 없는 코드는 같은 백의 대표 코드로', () => {
		expect(errorStateFor(499)).toBe(ERROR_STATES[400]);
		expect(errorStateFor(599)).toBe(ERROR_STATES[500]);
	});

	it('표준 4xx·5xx 코드는 모두 문구가 있다', () => {
		const standard = [
			400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424,
			425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
		];
		for (const code of standard) expect(ERROR_STATES[code], String(code)).toBeDefined();
	});
});

import { describe, expect, it } from 'vitest';
import { describeUserAgent } from '@/utils/userAgent';

describe('describeUserAgent', () => {
	it.each([
		[
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
			'Safari',
			'macOS',
			false,
		],
		[
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0',
			'Edge',
			'Windows',
			false,
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1',
			'Chrome',
			'iPhone',
			true,
		],
		[
			'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36',
			'삼성 인터넷',
			'Android',
			true,
		],
	])('%s', (ua, browser, os, mobile) => {
		expect(describeUserAgent(ua)).toEqual({ browser, os, mobile });
	});

	it('없으면 알 수 없음', () => {
		expect(describeUserAgent(null)).toEqual({ browser: '알 수 없는 브라우저', os: '알 수 없는 기기', mobile: false });
	});
});

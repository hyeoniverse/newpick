import { clientKey } from './client-throttler.guard';

describe('요청 횟수 제한을 누가 보냈는지로 센다', () => {
	const req = (headers: Record<string, string | string[]> = {}, user?: unknown) =>
		({ headers, ip: '172.18.0.5', user }) as never;

	it('로그인한 요청은 사용자 id로 (터널 IP 하나로 모두가 묶이지 않게)', () => {
		expect(clientKey(req({ 'cf-connecting-ip': '203.0.113.7' }, { id: 12 }))).toBe('user:12');
	});

	it('로그인하지 않은 요청은 Cloudflare가 넣은 접속자 IP로', () => {
		expect(clientKey(req({ 'cf-connecting-ip': ' 203.0.113.7 ' }))).toBe('ip:203.0.113.7');
		expect(clientKey(req({ 'cf-connecting-ip': ['198.51.100.2'] }))).toBe('ip:198.51.100.2');
	});

	it('다른 사람은 다른 열쇠 (예전에는 모두 터널 컨테이너 IP 하나)', () => {
		const a = clientKey(req({ 'cf-connecting-ip': '203.0.113.7' }));
		const b = clientKey(req({ 'cf-connecting-ip': '203.0.113.8' }));
		expect(a).not.toBe(b);
	});

	it('Cloudflare 머리글이 없으면(로컬) req.ip', () => {
		expect(clientKey(req())).toBe('ip:172.18.0.5');
	});

	it('X-Forwarded-For는 믿지 않는다 (접속자가 마음대로 넣을 수 있어서)', () => {
		expect(clientKey(req({ 'x-forwarded-for': '1.1.1.1', 'cf-connecting-ip': '203.0.113.7' }))).toBe('ip:203.0.113.7');
		expect(clientKey(req({ 'x-forwarded-for': '1.1.1.1' }))).toBe('ip:172.18.0.5');
	});
});

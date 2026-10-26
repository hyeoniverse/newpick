import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/useAuthStore';

beforeEach(() => {
	document.documentElement.dataset.auth = 'in';
	useAuthStore.setState({ user: null, session: 'unknown' });
});

describe('로그인 표시 (<html data-auth>)', () => {
	it('로그아웃하면 바로 out으로 바꿔 로그인 버튼이 보이게 한다', () => {
		useAuthStore.getState().clearUser();
		expect(document.documentElement.dataset.auth).toBe('out');
		expect(useAuthStore.getState().session).toBe('out');
	});

	it('세션이 정해지면 따라 바꾸고, 아직 모를 때(unknown)는 그대로 둔다', () => {
		useAuthStore.getState().setSession('unknown');
		expect(document.documentElement.dataset.auth).toBe('in');
		useAuthStore.getState().setSession('out');
		expect(document.documentElement.dataset.auth).toBe('out');
		useAuthStore.getState().setSession('in');
		expect(document.documentElement.dataset.auth).toBe('in');
	});
});

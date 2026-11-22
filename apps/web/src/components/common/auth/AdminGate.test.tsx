import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@newpick/shared';
import type { User } from '@/types/user';
import AdminGate from './AdminGate';
import { InitialProfileProvider } from './InitialProfile';

let auth: { user: User | null; session: 'unknown' | 'in' | 'out' };
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('@/components/common/ErrorState', () => ({ default: ({ code }: { code: number }) => <p>오류 {code}</p> }));
vi.mock('@/components/common/loader/Spinner', () => ({ default: () => <p>불러오는 중</p> }));

const ADMIN: Profile = {
	id: 22,
	email: 'admin@example.com',
	username: '관리자',
	profileImg: null,
	timezone: 'Asia/Seoul',
	role: 'admin',
	interests: [],
};

const gate = (profile: Profile | null) =>
	render(
		<InitialProfileProvider profile={profile}>
			<AdminGate>
				<p>관리자 화면</p>
			</AdminGate>
		</InitialProfileProvider>,
	);

beforeEach(() => {
	auth = { user: null, session: 'unknown' };
});
afterEach(cleanup);

describe('AdminGate: 서버가 받아 둔 프로필', () => {
	it('브라우저가 받기 전에도 서버 프로필이 관리자면 화면을 바로 그린다 (스피너 → 화면으로 밀리지 않게)', () => {
		gate(ADMIN);
		expect(screen.getByText('관리자 화면')).toBeTruthy();
		expect(screen.queryByText('불러오는 중')).toBeNull();
	});

	it('서버 프로필이 관리자가 아니면 403', () => {
		gate({ ...ADMIN, role: 'user' });
		expect(screen.getByText('오류 403')).toBeTruthy();
	});

	it('서버에서 못 받았으면(null) 예전처럼 브라우저가 받을 때까지 스피너', () => {
		gate(null);
		expect(screen.getByText('불러오는 중')).toBeTruthy();
	});

	it('브라우저가 받은 값이 오면 그것을 쓴다 (관리자에서 내려간 계정은 403)', () => {
		auth = { user: { ...ADMIN, role: 'user', isSubscribed: null }, session: 'in' };
		gate(ADMIN);
		expect(screen.getByText('오류 403')).toBeTruthy();
	});

	it('로그아웃하면 서버 프로필은 쓰지 않는다 (401)', () => {
		auth = { user: null, session: 'out' };
		gate(ADMIN);
		expect(screen.getByText('오류 401')).toBeTruthy();
	});
});

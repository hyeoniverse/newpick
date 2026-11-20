import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@newpick/shared';
import type { User } from '@/types/user';
import MyProfile from './MyProfile';

let auth: { user: User | null; session: 'unknown' | 'in' | 'out' };
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('@/hooks/useTab', () => ({ useTab: () => ({ setActiveTab: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock('./profile/SubscribeToggle', () => ({ default: () => <div>구독 스위치</div> }));

const SERVER: Profile = {
	id: 22,
	email: 'reader@example.com',
	username: '뉴픽 독자',
	profileImg: null,
	timezone: 'Asia/Seoul',
	role: 'user',
	interests: [],
};

beforeEach(() => {
	auth = { user: null, session: 'unknown' };
});
afterEach(cleanup);

describe('MyProfile (#307)', () => {
	it('서버가 받아 둔 프로필로 브라우저가 받기 전에도 이름 · 메일을 그린다 (구독 스위치는 받은 뒤에)', () => {
		render(<MyProfile initialProfile={SERVER} />);
		expect(screen.getByText('뉴픽 독자')).toBeTruthy();
		expect(screen.getByText('reader@example.com')).toBeTruthy();
		expect(screen.queryByText('구독 스위치')).toBeNull();
	});

	it('브라우저가 받은 값이 오면 그것을 쓴다 (다른 계정으로 바뀌었어도 앞 계정이 남지 않게)', () => {
		auth = {
			user: { ...SERVER, id: 23, username: '다른 독자', email: 'other@example.com', isSubscribed: true },
			session: 'in',
		};
		render(<MyProfile initialProfile={SERVER} />);
		expect(screen.getByText('다른 독자')).toBeTruthy();
		expect(screen.queryByText('뉴픽 독자')).toBeNull();
		expect(screen.getByText('구독 스위치')).toBeTruthy();
	});

	it('로그아웃하면 서버 프로필도 쓰지 않는다', () => {
		auth = { user: null, session: 'out' };
		render(<MyProfile initialProfile={SERVER} />);
		expect(screen.queryByText('뉴픽 독자')).toBeNull();
	});

	it('서버에서 못 받았으면(null) 예전처럼 자리만 잡아 둔다', () => {
		render(<MyProfile initialProfile={null} />);
		expect(screen.queryByText('reader@example.com')).toBeNull();
	});
});

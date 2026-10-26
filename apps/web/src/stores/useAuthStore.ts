import { create } from 'zustand';
import { User } from '@/models/user.model';

/**
 * 로그인 표시 쿠키로 판단한 세션 상태.
 * - unknown: 아직 쿠키를 읽기 전 (서버 렌더링, 하이드레이션 직후)
 * - in: 로그인 상태. 사용자 정보는 조회 중일 수 있습니다
 * - out: 로그아웃 상태
 */
export type SessionStatus = 'unknown' | 'in' | 'out';

interface AuthState {
	user: User | null;
	session: SessionStatus;
	setUser: (user: User | null) => void;
	clearUser: () => void;
	setSession: (session: SessionStatus) => void;
}

/**
 * 헤더는 <html data-auth>로 로그인 버튼·프로필 중 하나만 보여 준다 (layout.tsx가 처음 한 번 정함).
 * 세션이 바뀌면 이 값도 바꿔야 로그아웃 직후 로그인 버튼이 바로 나타난다
 */
const syncAuthAttribute = (session: SessionStatus) => {
	if (typeof document !== 'undefined' && session !== 'unknown') {
		document.documentElement.dataset.auth = session;
	}
};

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	session: 'unknown',
	setUser: (user) => set({ user }),
	clearUser: () => {
		syncAuthAttribute('out');
		set({ user: null, session: 'out' });
	},
	setSession: (session) => {
		syncAuthAttribute(session);
		set({ session });
	},
}));

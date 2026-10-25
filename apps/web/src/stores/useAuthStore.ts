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

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	session: 'unknown',
	setUser: (user) => set({ user }),
	clearUser: () => set({ user: null, session: 'out' }),
	setSession: (session) => set({ session }),
}));

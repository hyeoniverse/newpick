'use client';

import { createContext, useContext } from 'react';
import type { Profile } from '@newpick/shared';
import { useAuth } from '@/hooks/useAuth';

/**
 * 서버가 로그인 쿠키로 받아 둔 프로필 (api/serverProfile.ts). 관리자 화면 layout · 마이페이지 page가 넣어 준다.
 * 브라우저가 프로필을 받기 전에도 누구인지(관리자 여부 · 내 id) 알아, 스피너 → 화면으로 통째로 바뀌며 아래가 밀리던 것(CLS)과
 * 내 데이터를 브라우저가 프로필을 받은 뒤에야 요청하던 것(LCP)을 없앤다
 */
const InitialProfileContext = createContext<Profile | null>(null);

export function InitialProfileProvider({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
	return <InitialProfileContext.Provider value={profile}>{children}</InitialProfileContext.Provider>;
}

export const useInitialProfile = () => useContext(InitialProfileContext);

/**
 * 로그인한 사람: 브라우저가 받은 값이 있으면 그것, 아직이면 서버가 받아 둔 프로필. 로그아웃하면 null.
 * 내 데이터 조회의 key(내 id) · 켜기(enabled)에 쓴다
 */
export function useSignedInUser() {
	const { user, session } = useAuth();
	const initialProfile = useInitialProfile();
	return user ?? (session === 'out' ? null : initialProfile);
}

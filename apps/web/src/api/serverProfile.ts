import { cookies } from 'next/headers';
import type { Profile } from '@newpick/shared';
import { API_ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/api/client';
import { COOKIES } from '@/constants/storage';

/** 서버에서 프로필을 기다리는 최대 시간. 넘으면 예전처럼 브라우저가 받아 그린다 (첫 응답이 api 때문에 오래 멈추지 않게) */
const TIMEOUT_MS = 1500;

/**
 * 서버(마이페이지 page.tsx)에서 로그인 쿠키로 프로필을 받는다. 첫 HTML에 프로필 사진 · 이름이 들어가
 * JS가 다 돌기 전에 보인다 (#307, 예전에는 하이드레이션 뒤 브라우저가 받아 LCP 3.4초).
 * - 토큰 갱신은 middleware가 이 요청 전에 끝내 둔다(만료면 새 토큰을 요청 쿠키에 넣어 줌)
 * - 토큰이 없거나 · 거절되거나 · 늦거나 · api가 꺼져 있으면 null → 브라우저가 받아 그리는 예전 길로
 * - cookies()를 읽어 이 페이지는 요청마다 그린다(동적). Next가 Cache-Control: private, no-store를 붙여
 *   다른 사람의 프로필이 CDN · 브라우저 캐시로 섞이지 않는다
 */
export async function fetchProfileOnServer(): Promise<Profile | null> {
	const token = (await cookies()).get(COOKIES.access)?.value;
	if (!token) return null;
	try {
		// 서버에서는 apiFetch가 백엔드(API_URL)를 바로 부르고, 401이어도 다시 시도하지 않는다
		return await apiFetch<Profile>(API_ENDPOINTS.MY.PROFILE(), {
			headers: { Cookie: `${COOKIES.access}=${token}` },
			cache: 'no-store',
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
	} catch {
		return null;
	}
}

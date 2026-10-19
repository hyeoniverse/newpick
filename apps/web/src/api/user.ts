import 'server-only';
import { cookies } from 'next/headers';
import { User as IUser } from '@/models/user.model';
import { API_ENDPOINTS } from '@/constants/api';
import { apiFetch } from '@/api/client';
import { toIsSubscribed } from '@/api/subscription';

/**
 * 서버 렌더링용 사용자 조회. 요청에 담긴 인증 쿠키를 백엔드로 그대로 전달합니다.
 * 만료된 access token은 middleware가 페이지 렌더링 전에 갱신해 두므로 여기서는 재시도하지 않습니다.
 * (이전의 재시도는 응답의 accessToken을 access_token으로 읽어 한 번도 동작하지 않았습니다.)
 */
export const fetchUserWithSubscription = async (): Promise<IUser | null> => {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get('access_token')?.value;
	if (!accessToken) return null;

	const init = {
		cache: 'no-store' as const,
		headers: { Cookie: `access_token=${accessToken}` },
	};

	try {
		const user = await apiFetch<IUser>(API_ENDPOINTS.MY.PROFILE(), init);
		// 구독 상태 조회가 실패해도 사용자 정보는 유지합니다.
		const subscription = await apiFetch<{ status?: 'active' | 'paused' }>(API_ENDPOINTS.SUBSCRIBERS.STATUS(), init).catch(
			() => null,
		);
		return { ...user, isSubscribed: toIsSubscribed(subscription?.status) };
	} catch {
		return null;
	}
};

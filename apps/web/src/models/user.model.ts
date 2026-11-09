import type { Profile } from '@newpick/shared';

/**
 * 로그인한 사람: 프로필(@newpick/shared, api 응답과 같다) + 구독 여부(따로 불러와 붙인다, 모르면 null)
 */
export interface User extends Profile {
	isSubscribed: boolean | null;
}

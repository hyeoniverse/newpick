import type { Folder, MailsPage } from '@newpick/shared';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import { API_ENDPOINTS } from '@/constants/api';
import { queryKeys } from '@/api/queryKeys';
import { MAIL_PAGE_SIZE } from '@/api/mails';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavigation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';
import { InitialProfileProvider } from '@/components/common/auth/InitialProfile';
import { fetchProfileOnServer, fetchWithCookieOnServer } from '@/api/serverProfile';

/** 첫 탭: 주소에 ?tab=이 없거나 받은 메일일 때 */
const FIRST_TAB = MYPAGE_NAVIGATION[0].link;

/**
 * 첫 탭(받은 메일)의 첫 쪽 · 폴더를 서버에서 받아 브라우저 조회 캐시에 넣는다 (HydrationBoundary).
 * 운영 휴대폰 LCP는 받은 메일 첫 제목이었는데, JS → 탭 코드 → 폴더 · 목록 요청 → 그리기 순서라 3.6초(계산 6.2초)였다.
 * key는 useFolders · useMailPages와 같다 (내 id · 거르기 없음 · 처음부터). 못 받은 것은 넣지 않아 브라우저가 받는다
 */
function inboxCache(userId: number, folders: Folder[] | null, mails: MailsPage | null) {
	const queryClient = new QueryClient();
	if (folders) queryClient.setQueryData(queryKeys.folders.list(userId), folders);
	if (mails) {
		queryClient.setQueryData(queryKeys.mails.page(userId, '', 0), {
			pages: [{ ...mails, offset: 0 }],
			pageParams: [0],
		});
	}
	return dehydrate(queryClient);
}

export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
	const { tab } = await searchParams;
	const firstTab = !tab || tab === FIRST_TAB;
	// 프로필 사진이 첫 화면의 큰 그림이라 서버에서 받아 첫 HTML에 넣는다 (#307). 첫 탭이면 목록 · 폴더도 같이(한꺼번에)
	const [initialProfile, folders, mails] = await Promise.all([
		fetchProfileOnServer(),
		firstTab ? fetchWithCookieOnServer<Folder[]>(API_ENDPOINTS.MY.FOLDERS()) : null,
		firstTab ? fetchWithCookieOnServer<MailsPage>(API_ENDPOINTS.MY.MAILS(0, MAIL_PAGE_SIZE)) : null,
	]);
	const inbox = initialProfile && firstTab ? inboxCache(initialProfile.id, folders, mails) : null;
	return (
		<InitialProfileProvider profile={initialProfile}>
			<HydrationBoundary state={inbox}>
				<div className="np-protected-page">
					<Title size="extraSmall">마이페이지</Title>
					<br />
					<MyProfile initialProfile={initialProfile} />
					<TabNavigation tabs={MYPAGE_NAVIGATION} />
					<MyTabs />
				</div>
			</HydrationBoundary>
		</InitialProfileProvider>
	);
}

import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavigation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';
import { fetchProfileOnServer } from '@/api/serverProfile';

export default async function MyPage() {
	// 프로필 사진이 첫 화면에서 가장 큰 그림(LCP)이라 서버에서 받아 첫 HTML에 넣는다 (#307)
	const initialProfile = await fetchProfileOnServer();
	return (
		<div className="np-protected-page">
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile initialProfile={initialProfile} />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<MyTabs />
		</div>
	);
}

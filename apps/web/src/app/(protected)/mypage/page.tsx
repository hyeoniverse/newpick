import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavigation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';

export default async function MyPage() {
	return (
		<div className="np-protected-page">
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<MyTabs />
		</div>
	);
}

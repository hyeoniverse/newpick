import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import { fetchUserWithSubscription } from '@/api/user';

import styles from '@/app/(protected)/mypage/mypage.module.css';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavgation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';
import { redirect } from 'next/navigation';

export default async function MyPage() {
	const user = await fetchUserWithSubscription();
	if (!user) {
		console.warn('🔒 사용자 정보 없음 → 로그인 페이지로 리디렉션');
		redirect('/');
	}

	return (
		<div className={styles.myPage}>
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile user={user} />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<MyTabs status={user.isSubscribed} interests={user.interests} />
		</div>
	);
}

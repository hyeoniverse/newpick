import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import styles from '@/app/(protected)/mypage/mypage.module.css';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavgation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';

export default async function MyPage() {
	return (
		<div className={styles.myPage}>
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<MyTabs />
		</div>
	);
}

import { MYPAGE_NAVIGATION } from '@/constants/navigation';
import styles from '@/app/(protected)/protected.module.css';
import Title from '@/components/common/Title';
import MyProfile from '@/app/(protected)/mypage/_components/MyProfile';
import TabNavigation from '@/components/common/TabNavgation';
import MyTabs from '@/app/(protected)/mypage/_components/MyTabs';
import { Noto_Serif_KR } from 'next/font/google';

/** 내 뉴스레터 · 북마크의 신문 지면 제목용 세리프 (굵은 것만, 마이페이지에서만 받음) */
const serif = Noto_Serif_KR({
	weight: ['700', '900'],
	subsets: ['latin'],
	preload: false,
	display: 'swap',
	variable: '--font-serif',
});

export default async function MyPage() {
	return (
		<div className={`${styles.page} ${serif.variable}`}>
			<Title size="extraSmall">마이페이지</Title>
			<br />
			<MyProfile />
			<TabNavigation tabs={MYPAGE_NAVIGATION} />
			<MyTabs />
		</div>
	);
}

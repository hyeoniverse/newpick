import Title from '@/components/common/Title';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';
import styles from '@/app/(home)/home.module.css';

export default async function HomePage() {
	return (
		<div className={styles.homePage}>
			<HeroSection />
			<hr />
			<TrendSection />

			<FullWidthPanel>
				<Title size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터를 시작해보세요
				</Title>
			</FullWidthPanel>

			<SubscribeSection />
		</div>
	);
}

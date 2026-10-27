import type { Metadata } from 'next';
import styles from '@/app/about/about.module.css';
import HeroSection from '@/app/about/_components/HeroSection';
import NumbersSection from '@/app/about/_components/NumbersSection';
import StatementSection from '@/app/about/_components/StatementSection';
import WhyNewpickSection from '@/app/about/_components/WhyNewpickSection';
import MorningSection from '@/app/about/_components/MorningSection';
import FaqSection from '@/app/about/_components/FaqSection';
import CoreFeature from '@/app/about/_components/CoreFeature';
import ExploreSection from '@/app/about/_components/ExploreSection';
import WhoSection from '@/app/about/_components/WhoSection';
import HowToUseSection from '@/app/about/_components/HowToUseSection';
import Logos from '@/app/about/_components/Logos';
import ScrollReveal from '@/components/common/ScrollReveal';

/** 섹션 안에서 하나씩 나타날 것: 숫자, 가치, 질문, 팀원·한 일 */
const REVEAL_ITEMS = '#about-numbers .item, [aria-label="자주 묻는 질문"] .item, .member, .work';

export const metadata: Metadata = {
	title: '시작하기',
	description: '내 관심사만 골라, 매일 아침 한 통으로. 뉴픽이 뉴스레터를 만드는 방법과 시작하는 법을 소개합니다.',
};

async function AboutPage() {
	return (
		<ScrollReveal className={styles.about} items={REVEAL_ITEMS}>
			<HeroSection />
			<StatementSection />
			<WhyNewpickSection />
			<NumbersSection />
			<CoreFeature />
			<MorningSection />
			<HowToUseSection />
			<Logos />
			<FaqSection />
			<ExploreSection />
			<WhoSection />
		</ScrollReveal>
	);
}

export default AboutPage;

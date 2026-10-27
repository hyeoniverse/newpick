import styles from '@/app/about/about.module.css';
import HeroSection from '@/app/about/_components/HeroSection';
import NumbersSection from '@/app/about/_components/NumbersSection';
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
const REVEAL_ITEMS = '#about-numbers .item, [aria-label="WHY NEWPICK"] .value, [aria-label="자주 묻는 질문"] .item, .member, .work';

async function AboutPage() {
	return (
		<ScrollReveal className={styles.about} items={REVEAL_ITEMS}>
			<HeroSection />
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

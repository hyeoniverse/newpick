import styles from '@/app/about/about.module.css';
import WhyNewpickSection from '@/app/about/_components/WhyNewpickSection';
import CoreFeature from '@/app/about/_components/CoreFeature';
import ExploreSection from '@/app/about/_components/ExploreSection';
import WhoSection from '@/app/about/_components/WhoSection';
import HowToUseSection from '@/app/about/_components/HowToUseSection';
import Logos from '@/app/about/_components/Logos';
import ScrollReveal from '@/components/common/ScrollReveal';

/** 섹션 안에서 하나씩 나타날 것: 가치 문장, 핵심 기능, 사용 단계, 팀원·한 일 */
const REVEAL_ITEMS = '.value-text p, .core-item, .sns, .categories, .newsletter-mail, .member, .work';

async function AboutPage() {
	return (
		<ScrollReveal className={styles.about} items={REVEAL_ITEMS}>
			<WhyNewpickSection />
			<CoreFeature />
			<HowToUseSection />
			<Logos />
			<ExploreSection />
			<WhoSection />
		</ScrollReveal>
	);
}

export default AboutPage;

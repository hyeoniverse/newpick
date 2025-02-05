import styles from '@/app/about/about.module.css';
import WhyNewpickSection from '@/app/about/_components/WhyNewpickSection';
import CoreFeature from '@/app/about/_components/CoreFeature';
import ExploreSection from '@/app/about/_components/ExploreSection';
import WhoSection from '@/app/about/_components/WhoSection';
import HowToUseSection from '@/app/about/_components/HowToUseSection';
import Logos from '@/app/about/_components/Logos';

async function AboutPage() {
	return (
		<div className={styles.about}>
			<WhyNewpickSection />
			<CoreFeature />
			<HowToUseSection />
			<Logos />
			<ExploreSection />
			<WhoSection />
		</div>
	);
}

export default AboutPage;

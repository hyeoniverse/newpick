import { ArticleDetail as IArticleDetail, ArticleCard as IArticleCard } from '@/models/article.model';
import { fetchTrendList } from '@/api/article';
import { getFirstImage } from '@/utils/getFirstImage';
import { mapIdToTitle } from '@/utils/mapInterests';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { dateFormatter } from '@/utils/formatter';

import styles from '@/app/(home)/home.module.css';
import Title from '@/components/common/Title';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';

export default async function HomePage() {
	let parsedTrends: IArticleCard[] = [];
	try {
		const trends: IArticleDetail[] = await fetchTrendList();
		parsedTrends = trends.map((trend) => ({
			id: trend.id,
			categoryName: mapIdToTitle([trend.categoryId])[0],
			image: getFirstImage(trend.imageUrl!) || '',
			title: stripCodeFence(trend.title),
			summary: stripCodeFence(trend.content),
			date: dateFormatter(trend.createdAt),
		}));

		console.log(parsedTrends);
	} catch (error) {
		console.error(error);
	}

	return (
		<div className={styles.homePage}>
			<HeroSection />
			<hr />
			<TrendSection trends={parsedTrends} />

			<FullWidthPanel>
				<Title size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터를 시작해보세요
				</Title>
			</FullWidthPanel>

			<SubscribeSection trends={parsedTrends} />
		</div>
	);
}

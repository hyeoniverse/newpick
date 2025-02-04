import Article from '@/app/articles/detail/[slug]/_components/Article';
import { increaseViewCount } from '@/api/view';

type PageParams = Promise<{ slug: string }>;

export default async function NewsletterDetailPage({ params }: { params: PageParams }) {
	const { slug } = await params;
	const viewCount = await increaseViewCount(parseInt(slug));

	return (
		<>
			<Article
				viewCount={viewCount.data}
			/>
		</>
	);
}

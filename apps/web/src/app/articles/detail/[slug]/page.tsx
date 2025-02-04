import Article from '@/app/articles/detail/[slug]/_components/Article';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { getArticleContent, getArticleList, getPopularArticles } from '@/hooks/useArticle';
import { increaseViewCount } from '@/api/view';

type PageParams = Promise<{ slug: string }>;

export default async function NewsletterDetailPage({ params }: { params: PageParams }) {
	const { slug } = await params;

	const articleInfo = await getArticleContent(slug);
	const articleContent = articleInfo.newsletter;
	const articleContentHTML = stripCodeFence(articleContent.contentAsHTML, 'html');

	const popularArticles = await getPopularArticles(5, 0, true);
	const latestArticles = await getArticleList(9);

	const viewCount = await increaseViewCount(articleContent.id);

	return (
		<>
			<Article
				viewCount={viewCount.data}
				article={articleContent}
				summary={articleContent.content ? articleContent.content : ''}
				content={articleContentHTML}
				popular={popularArticles}
				latest={latestArticles}
				newsId={articleContent.id}
				prev={articleInfo.previousNewsletter}
				next={articleInfo.nextNewsletter}
			/>
		</>
	);
}

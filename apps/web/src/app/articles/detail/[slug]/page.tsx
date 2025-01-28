import Article from '@/app/articles/detail/[slug]/_components/Article';
import API_ENDPOINTS from '@/constants/api';
import TitleSection from '@/app/articles/detail/[slug]/_components/content/TitleSection';
import { dateFormatter } from '@/utils/formatter';
import { IArticleDetail } from '@/models/articleDetail';
import { stripCodeFence } from '@/utils/stripCodeFence';

export default async function NewsletterDetailPage({
	params,
}: {
	params: {slug: string};
}) {
	const { slug } = (await params);
	console.log(slug);

	const res = await fetch(`${API_ENDPOINTS.NEWSLETTER.BASE}/${slug}`);

	if (!res.ok) {
		throw new Error('Failed to fetch detail');
	}
	console.log("dsdfsdfsdfsdfsdfs", res, "Datenow", Date.now());

	const data = await res.json();
	const article: IArticleDetail = data.data;

	const cleanContentAsHTML = stripCodeFence(article.contentAsHTML, 'html');

	console.log('article', article);

	return (
		<>
			<TitleSection
				category={article.categoryId}
				title={article.title}
				date={dateFormatter(article.createdAt)}
			/>
			<div className="content-section">
				<Article
					summary={article.content ? article.content : ''}
					content={cleanContentAsHTML}
				/>
			</div>
		</>
	);
}

//
// const NewsletterDetailPageStyled = styled.div`
// 	//margin: 2.5rem 0;
//     //
// 	//height: 100%;
// 	//width: 100%;
// `;
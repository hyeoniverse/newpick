import Article from '@/app/articles/detail/[slug]/_components/Article';
import TitleSection from '@/app/articles/detail/[slug]/_components/content/TitleSection';
import { dateFormatter } from '@/utils/formatter';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { getArticleContent, getArticleList, getPopularArticles } from '@/services/articleService';

export default async function NewsletterDetailPage({ params }: { params: { slug: string }; }) {
  const { slug } = (await params);

  const articleContent = await getArticleContent(slug);
  const articleContentHTML = stripCodeFence(articleContent.contentAsHTML, 'html');

  const popularArticles = await getPopularArticles(100);
  const latestArticles = await getArticleList(9);

  return (
    <>
      {/*<TitleSection*/}
      {/*  category={articleContent.categoryId}*/}
      {/*  title={articleContent.title}*/}
      {/*  date={dateFormatter(articleContent.createdAt)}*/}
      {/*/>*/}
      <Article
        article={articleContent}
        summary={articleContent.content ? articleContent.content : ''}
        content={articleContentHTML}
        popular={popularArticles}
        latest={latestArticles}
        newsId={articleContent.id}
      />
    </>
  );
}
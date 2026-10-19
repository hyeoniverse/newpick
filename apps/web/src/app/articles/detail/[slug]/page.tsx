import Article from '@/app/articles/detail/[slug]/_components/Article';

/** 기사 본문은 Article에서 조회하고, 조회수는 브라우저에서 올립니다(useViewCount). */
export default function NewsletterDetailPage() {
	return <Article />;
}

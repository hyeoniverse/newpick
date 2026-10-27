import { CATEGORIES } from '@/constants/categories';
import { ArticleDetail } from '@/models/article.model';

const DESCRIPTION_MAX = 120;

/** 마크다운 · HTML 흔적과 줄바꿈을 걷어 낸 한 줄 */
const plain = (text: string) =>
	text
		.replace(/<[^>]+>/g, ' ')
		.replace(/[#>*_`~=[\]()-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

/**
 * 공유 미리보기 · 검색 결과에 보일 설명 (#15).
 * 부제가 있으면 부제, 없으면(예전 뉴스레터) 본문 앞부분을 120자까지
 */
export function articleDescription(article: Pick<ArticleDetail, 'subtitle' | 'content'>) {
	if (article.subtitle?.trim()) return article.subtitle.trim();
	const text = plain(article.content ?? '');
	return text.length > DESCRIPTION_MAX ? `${text.slice(0, DESCRIPTION_MAX - 1)}…` : text;
}

export const categoryName = (categoryId: number) =>
	CATEGORIES.find((category) => category.id === Number(categoryId))?.name;

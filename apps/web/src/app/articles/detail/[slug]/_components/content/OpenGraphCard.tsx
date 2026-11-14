import { queryKeys } from '@/api/queryKeys';
import { useQuery } from '@tanstack/react-query';
import { NewsInfo as INewsInfo } from '@/types/article';
import { dateFormatter } from '@/utils/formatter';
import { getRelatedNews } from '@/hooks/useArticle';
import { DEFAULT_IMAGES } from '@/constants/images';

import { FaLink } from 'react-icons/fa';
import ExternalLink from '@/components/common/ExternalLink';
import Image from '@/components/common/Image';

interface Props {
	urls: string[];
}

/**
 * 관련 뉴스: 이 뉴스레터를 만들 때 쓴 언론사 기사. 누르면 새 탭으로 원문.
 * 배경 · 테두리 없이 얇은 선으로 나눈 목록, 사진은 오른쪽
 */
export default function OpenGraphCard({ urls }: Props) {
	// 주소 목록(내용)으로 캐시해, 화면이 다시 그려져도(스크롤 등) 다시 요청하지 않는다.
	// 예전에는 urls 배열이 그릴 때마다 새로 만들어져 useEffect가 매번 다시 요청했고,
	// API 요청 제한(429)에 걸린 요청이 빠지면서 카드가 떴다 사라졌다
	const { data: relatedNewsData = [] } = useQuery<INewsInfo[]>({
		queryKey: queryKeys.articles.related(urls.join(',')),
		queryFn: () => getRelatedNews(urls),
		enabled: urls.length > 0,
		staleTime: 1000 * 60 * 30,
	});

	// 주소가 달라도(리다이렉트 등) 원문 링크가 같으면 같은 기사: 한 번만
	const items = relatedNewsData.filter((item, i, all) => all.findIndex((other) => other.link === item.link) === i);
	if (items.length === 0) return null;

	return (
		<section className="mt-8 mb-16">
			<h2 className="heading mb-3 flex items-center gap-2 text-medium font-semi-bold text-text [&_svg]:w-3.5 [&_svg]:text-primary">
				<FaLink aria-hidden />
				관련 뉴스
			</h2>
			<ul className="list m-0 border-0 border-t border-solid border-border p-0">
				{items.map((news) => (
					<li key={news.link} className="border-0 border-b border-solid border-border">
						<ExternalLink
							href={news.link}
							showIcon={false}
							className="item flex flex-row-reverse items-center justify-between gap-5 py-5 text-inherit no-underline"
						>
							{/* 사진은 마우스를 올리면 살짝 커진다. 안의 Image가 정한 전환(opacity)보다 이 전환이 앞서게 ! */}
							<span className="photo block w-44 shrink-0 overflow-hidden rounded-surface mobile:w-26 [&_img]:[transition:transform_0.4s_ease]! motion-reduce:[&_img]:[transition:none]! motion-safe:group-hover:[&_img]:[transform:scale(1.04)]">
								<Image src={news.images[0] || DEFAULT_IMAGES.MONO} alt="" ratio="wide" priority={false} />
							</span>
							<span className="text flex min-w-0 flex-1 flex-col gap-1.5">
								<span className="meta flex gap-1.5 text-extra-small text-sub-text">
									<span className="source font-semi-bold text-primary">{news.source}</span>
									<span aria-hidden>·</span>
									<span>{dateFormatter(news.publishedAt)}</span>
								</span>
								<span className="title line-clamp-2 font-semi-bold text-text [transition:color_0.2s_ease] group-hover:text-primary">
									{news.title}
								</span>
								<span className="summary line-clamp-2 text-small text-sub-text mobile:hidden">{news.content}</span>
							</span>
						</ExternalLink>
					</li>
				))}
			</ul>
		</section>
	);
}

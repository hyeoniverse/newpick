'use client';

import { TAGS } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { queryKeys } from '@/api/queryKeys';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LuPlus, LuX } from 'react-icons/lu';
import { fetchAllKeywords } from '@/api/article';
import { useTagFollows } from '@/hooks/useTagFollows';
import { toPageHref, readFilters } from '@/utils/newsletterSearch';
import Text from '@/components/common/Text';
import ListHead from '@/app/(protected)/mypage/_components/list/ListHead';

/** '10월 31일' (한국 시각) */
const day = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso));

/**
 * 마이페이지 > 지켜보기의 팔로우한 태그 (#123, 지켜보는 소식 위): 매일 메일의 '팔로우한 태그' 칸에 태그마다 그날 소식(모든 분야)과
 * 뉴스레터에 실리지 않은 기사 중 제목에 나온 것을 모아 보낸다 (맞춤을 꺼도).
 * 여기서는 지켜보는 소식처럼 태그마다 카드 하나에 그 태그가 붙은 최근 뉴스레터를 시간순으로 보여 준다.
 * 여기서 바로 추가(태그 이름을 치면 실제 뉴스레터 태그 중 맞는 것을 많이 쓴 순으로)하거나, 뉴스레터 목록의 태그에서 팔로우한다
 */
export default function TagFollows() {
	const { follows, isPending, follow, unfollow } = useTagFollows();
	const [text, setText] = useState('');
	// 태그 전체 화면(/tags)과 같은 목록을 같이 쓴다
	const { data: allTags = [] } = useQuery({
		queryKey: queryKeys.keywords.byCategory(0),
		queryFn: () => fetchAllKeywords(),
		staleTime: 1000 * 60 * 10,
	});
	const needle = text.trim().replace(/^#+/, '').toLowerCase();
	const followed = new Set(follows.map((f) => f.tag));
	const suggestions = needle
		? allTags
				.filter((t) => !followed.has(t.keyword) && t.keyword.toLowerCase().includes(needle))
				.sort((a, b) => b.count - a.count)
				.slice(0, SUGGESTIONS)
		: [];
	const add = (tag: string) => {
		if (!tag.trim()) return;
		follow.mutate(tag.trim().replace(/^#+/, ''), { onSuccess: () => setText('') });
	};

	return (
		<section className="np-mypage-tag-follows-tag-follows">
			<div className="tag-follows-head">
				<ListHead title="팔로우한 태그" count={follows.length} />
				<Text size="small" color="subText">
					{TAGS.followsHint}
				</Text>
			</div>
			<form
				className="add"
				role="search"
				onSubmit={(event) => {
					event.preventDefault();
					// 맞는 태그가 있으면 그 표기로, 없으면 친 그대로 (서버가 뉴스레터 태그 표기에 맞춘다)
					add(suggestions.find((t) => t.keyword.toLowerCase() === needle)?.keyword ?? text);
				}}
			>
				<input
					type="text"
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder="태그 이름으로 찾아 추가 (예: 금리)"
					aria-label="팔로우할 태그 찾기"
					maxLength={64}
				/>
				<button type="submit" disabled={!needle || follow.isPending}>
					<LuPlus aria-hidden />
					추가
				</button>
			</form>
			{suggestions.length > 0 && (
				<ul className="suggestions" aria-label="맞는 태그">
					{suggestions.map((t) => (
						<li key={t.keyword}>
							<button type="button" disabled={follow.isPending} onClick={() => add(t.keyword)}>
								{/* #과 이름은 한 덩어리로 (단추의 gap이 그 사이를 벌리지 않게) */}
								<span>
									<span className="hash">#</span>
									{t.keyword}
								</span>
								<span className="count">{t.count}편</span>
								<LuPlus aria-hidden />
							</button>
						</li>
					))}
				</ul>
			)}
			{follows.length > 0 ? (
				<ul className="tag-cards">
					{follows.map(({ tag, createdAt, news = [] }) => {
						const href = toPageHref({ ...readFilters(new URLSearchParams()), keywords: [tag] });
						return (
							<li key={tag} className="tag-card">
								<div className="tag-head">
									<p className="meta">
										<span className="nowrap">{day(createdAt)}부터 팔로우</span>
									</p>
									<button
										type="button"
										className="stop"
										aria-label={`#${tag} 팔로우 끊기`}
										disabled={unfollow.isPending}
										onClick={() => unfollow.mutate(tag)}
									>
										<LuX aria-hidden />
										팔로우 끊기
									</button>
								</div>
								<Link href={href} className="tag-name">
									<span className="hash">#</span>
									{tag}
								</Link>
								{news.length ? (
									<ol className="timeline">
										{news.map((n) => (
											<li key={n.id}>
												<p className="when">
													{day(n.createdAt)}
													<span className="category">{n.category}</span>
												</p>
												<Link href={ROUTES.article(n.id)} className="heading">
													{n.title}
												</Link>
											</li>
										))}
									</ol>
								) : (
									<p className="none">{TAGS.noNewslettersYet}</p>
								)}
								{news.length >= 5 && (
									<Link href={href} className="all">
										#{tag} 뉴스레터 모두 보기
									</Link>
								)}
							</li>
						);
					})}
				</ul>
			) : (
				!isPending && (
					<p className="empty">
						{TAGS.emptyFollows.before} <Link href={ROUTES.tags}>{TAGS.emptyFollows.link}</Link>
						{TAGS.emptyFollows.after}
					</p>
				)
			)}
		</section>
	);
}

/** 맞는 태그를 몇 개까지 보여 줄지 */
const SUGGESTIONS = 6;

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
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
		queryKey: ['allKeywords', 0],
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
		<StyledTagFollows>
			<div className="tag-follows-head">
				<ListHead title="팔로우한 태그" count={follows.length} />
				<Text size="small" color="subText">
					매일 메일의 ‘팔로우한 태그’ 칸에 태그마다 그날 소식과 관련 기사를 모아 드리고, 여기에는 그 태그의 뉴스레터가
					시간순으로 쌓입니다. 20개까지 팔로우할 수 있습니다.
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
												<Link href={`/articles/detail/${n.id}`} className="heading">
													{n.title}
												</Link>
											</li>
										))}
									</ol>
								) : (
									<p className="none">아직 이 태그가 붙은 뉴스레터가 없습니다. 새 소식이 나오면 여기에 쌓입니다.</p>
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
						아직 팔로우한 태그가 없습니다. 위에서 찾아 추가하거나, <Link href="/tags">태그 전체 보기</Link>에서 태그를
						눌러 목록 위의 &lsquo;팔로우&rsquo;로 추가할 수 있습니다.
					</p>
				)
			)}
		</StyledTagFollows>
	);
}

/** 맞는 태그를 몇 개까지 보여 줄지 */
const SUGGESTIONS = 6;

const StyledTagFollows = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	word-break: keep-all;

	.tag-follows-head {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* 태그마다 카드: 지켜보는 소식 카드와 같은 모양 (팔로우한 날 · 끊기 / 태그 이름 / 시간순 줄) */
	.tag-cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tag-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 1rem;
		}
	}

	.tag-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.meta {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.nowrap {
			white-space: nowrap;
		}
	}

	.stop {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
		border: 0;
		background: none;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		svg {
			width: 0.875rem;
			height: 0.875rem;
		}

		&:hover:not(:disabled) {
			color: ${({ theme }) => theme.color.text};
		}
	}

	.tag-name {
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
		text-decoration: none;

		.hash {
			margin-right: 0.0625rem;
		}

		&:hover {
			text-decoration: underline;
			text-underline-offset: 0.2em;
		}
	}

	/* 태그가 붙은 뉴스레터: 왼쪽 실선 하나로 잇는다 (지켜보는 소식과 같은 줄) */
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		margin: 0.5rem 0 0;
		padding: 0 0 0 1rem;
		list-style: none;
		border-left: 2px solid ${({ theme }) => theme.color.tertiary};

		li {
			display: flex;
			flex-direction: column;
			gap: 0.125rem;
		}
	}

	.when {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.subText};
	}

	.category {
		padding: 0 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.tertiary};
		font-size: 0.75rem;
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.primary};
	}

	.heading {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		line-height: 1.5;
		color: ${({ theme }) => theme.color.text};
		text-decoration: none;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.none {
		margin: 0.25rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.all {
		align-self: flex-start;
		margin-top: 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}

	.add {
		display: flex;
		gap: 0.5rem;
		max-width: 28rem;

		input {
			flex: 1;
			min-width: 0;
			height: 2.5rem;
			padding: 0 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};

			&:focus-visible {
				outline: 2px solid ${({ theme }) => theme.color.primary};
				outline-offset: 1px;
			}
		}

		button {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			height: 2.5rem;
			padding: 0 0.875rem;
			border: none;
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.primary};
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: #ffffff;
			cursor: pointer;

			&:disabled {
				cursor: default;
				opacity: 0.5;
			}
		}
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
		list-style: none;

		button {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			padding: 0.25rem 0.5rem 0.25rem 0.625rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			&:hover:not(:disabled) {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}

			.hash {
				color: ${({ theme }) => theme.color.primary};
			}

			.count {
				margin-left: 0.125rem;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.subText};
			}

			svg {
				width: 0.875rem;
				height: 0.875rem;
			}
		}
	}

	.empty {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		a {
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}
	}
`;

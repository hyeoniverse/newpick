'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { LuBellPlus } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/loader/Skeleton';
import { StoryFollow, useFollowMutations, useFollows } from '@/hooks/useFollows';

/** '10월 31일' (한국 시각) */
const day = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso));

/**
 * 마이페이지 > 지켜보기: 지켜보는 소식마다 이어진 새 소식을 시간순으로 (처음 소식 → 후속들).
 * 이 탭을 열면 새 후속을 본 것으로 한다(머리글 표시가 꺼짐). 이번 화면에서는 '새' 표시를 그대로 둔다
 */
export default function MyFollows() {
	const { data: follows, isPending } = useFollows();
	const { unfollow, markSeen } = useFollowMutations();
	// 처음 불러왔을 때의 안 본 후속 (본 것으로 바꾼 뒤에도 이번 화면에서는 '새'로 보이게)
	const [fresh, setFresh] = useState<Set<number>>(new Set());
	const marked = useRef(false);

	useEffect(() => {
		if (!follows || marked.current) return;
		const unseen = follows.flatMap((f) => f.updates.filter((u) => !u.seenAt).map((u) => u.id));
		marked.current = true;
		setFresh(new Set(unseen));
		if (unseen.length) markSeen.mutate();
	}, [follows, markSeen]);

	if (isPending) return <Skeleton />;
	if (!follows?.length) {
		return (
			<EmptyState
				icon={LuBellPlus}
				title="지켜보는 소식이 없어요"
				description="뉴스레터의 소식마다 있는 '후속 지켜보기'를 누르면, 이어지는 새 소식이 나올 때 여기에 쌓이고 머리글에 알려 드립니다."
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	return (
		<StyledFollows>
			<p className="intro">지켜보는 소식 {follows.length}개 · 이어지는 새 소식은 하루 한 번 찾습니다.</p>
			<ul className="follows">
				{follows.map((f) => (
					<FollowCard key={f.id} follow={f} fresh={fresh} onUnfollow={() => unfollow.mutate(f.id)} />
				))}
			</ul>
		</StyledFollows>
	);
}

function FollowCard({
	follow,
	fresh,
	onUnfollow,
}: {
	follow: StoryFollow;
	fresh: Set<number>;
	onUnfollow: () => void;
}) {
	return (
		<li className="follow">
			<div className="head">
				<p className="meta">
					<span className="category">{follow.newsletter.category.name}</span>
					<span className="nowrap">{day(follow.newsletter.createdAt)} 소식</span>
					<span className="nowrap">{day(follow.createdAt)}부터 지켜보는 중</span>
				</p>
				<button type="button" className="stop" onClick={onUnfollow}>
					그만 지켜보기
				</button>
			</div>
			<Link href={`/articles/detail/${follow.newsletter.id}`} className="origin">
				{follow.heading}
			</Link>

			{follow.updates.length ? (
				<ol className="timeline">
					{follow.updates.map((u) => (
						<li key={u.id}>
							<p className="when">
								{day(u.newsletter.createdAt)}
								<span className="category">{u.newsletter.category.name}</span>
								{fresh.has(u.id) && <span className="new">새 소식</span>}
							</p>
							<Link href={`/articles/detail/${u.newsletter.id}`} className="heading">
								{u.heading}
							</Link>
							{u.reason && <p className="reason">{u.reason}</p>}
						</li>
					))}
				</ol>
			) : (
				<p className="empty">아직 이어진 소식이 없습니다. 새 소식이 나오면 여기에 쌓입니다.</p>
			)}
		</li>
	);
}

const StyledFollows = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 0 0 2rem;
	word-break: keep-all;

	.intro {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.follows {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.follow {
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

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.nowrap {
			white-space: nowrap;
		}
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

	.stop {
		flex-shrink: 0;
		padding: 0;
		border: 0;
		background: none;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.text};
			text-decoration: underline;
			text-underline-offset: 0.2em;
		}
	}

	.origin {
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.45;
		color: ${({ theme }) => theme.color.text};

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 처음 소식 아래로 이어진 소식: 왼쪽 실선 하나로 잇는다 */
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

	.new {
		padding: 0 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.primary};
		font-size: 0.75rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.background};
	}

	.heading {
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		line-height: 1.5;
		color: ${({ theme }) => theme.color.text};

		&:hover {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.reason {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	.empty {
		margin: 0.25rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}
`;

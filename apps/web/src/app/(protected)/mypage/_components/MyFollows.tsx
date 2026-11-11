'use client';

import { ROUTES } from '@/constants/routes';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LuBellPlus } from 'react-icons/lu';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/loader/Skeleton';
import { StoryFollow, useFollowMutations, useFollows } from '@/hooks/useFollows';
import ListHead from '@/app/(protected)/mypage/_components/list/ListHead';
import TagFollows from '@/app/(protected)/mypage/_components/follows/TagFollows';

/** '10월 31일' (한국 시각) */
const day = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso));

/**
 * 마이페이지 > 지켜보기: 지켜보는 소식마다 이어진 새 소식을 시간순으로 (처음 소식 → 후속들), 그 위에 팔로우한 태그(#123, 짧아서 먼저).
 * 둘 다 '직접 고른 것을 메일로 받는' 기능이라 한 탭에 둔다.
 * 이 탭을 열면 새 후속을 본 것으로 한다(머리글 표시가 꺼짐). 이번 화면에서는 '새' 표시를 그대로 둔다.
 * 30일 넘게 후속이 없는 소식은 카드 안에서 정리할지 묻는다 (사건은 끝나기 마련이라, 목록이 쌓이기만 하지 않게)
 */
export default function MyFollows() {
	const { data: follows, isPending } = useFollows();
	const { unfollow, markSeen, keep } = useFollowMutations();
	// 처음 불러왔을 때의 안 본 후속 (본 것으로 바꾼 뒤에도 이번 화면에서는 '새'로 보이게)
	const [fresh, setFresh] = useState<Set<number>>(new Set());
	const marked = useRef(false);

	useEffect(() => {
		if (!follows || marked.current) return;
		const unseen = follows.flatMap((f) => f.updates.filter((u) => !u.seenAt).map((u) => u.id));
		marked.current = true;
		setFresh(new Set(unseen));
		if (unseen.length) markSeen.mutate(undefined);
	}, [follows, markSeen]);

	return (
		<div className="np-mypage-my-follows-follows">
			<TagFollows />
			<section className="stories">
				<ListHead title="지켜보는 소식" count={follows?.length ?? 0} />
				{isPending ? (
					<Skeleton />
				) : follows?.length ? (
					<>
						<p className="intro">이어지는 새 소식은 하루 한 번 확인해 메일과 이 목록에 표시합니다.</p>
						<ul className="follows">
							{follows.map((f) => (
								<FollowCard
									key={f.id}
									follow={f}
									fresh={fresh}
									onUnfollow={() => unfollow.mutate(f.id)}
									onKeep={() => keep.mutate(f.id)}
								/>
							))}
						</ul>
					</>
				) : (
					<EmptyState
						icon={LuBellPlus}
						title="지켜보는 소식이 없습니다"
						description="뉴스레터의 각 소식에서 '후속 지켜보기'를 누르면 이어지는 새 소식이 여기에 모이고 머리글에도 표시됩니다."
						action={{ label: '뉴스레터 둘러보기', href: ROUTES.articles }}
					/>
				)}
			</section>
		</div>
	);
}

function FollowCard({
	follow,
	fresh,
	onUnfollow,
	onKeep,
}: {
	follow: StoryFollow;
	fresh: Set<number>;
	onUnfollow: () => void;
	onKeep: () => void;
}) {
	return (
		<li className="follow">
			<div className="follow-head">
				<p className="meta">
					<span className="category">{follow.newsletter.category.name}</span>
					<span className="nowrap">{day(follow.newsletter.createdAt)} 소식</span>
					<span className="nowrap">{day(follow.createdAt)}부터 지켜보는 중</span>
				</p>
				<button type="button" className="stop" onClick={onUnfollow}>
					그만 지켜보기
				</button>
			</div>
			<Link href={ROUTES.article(follow.newsletter.id)} className="origin">
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
							<Link href={ROUTES.article(u.newsletter.id)} className="heading">
								{u.heading}
							</Link>
							{u.reason && <p className="reason">{u.reason}</p>}
						</li>
					))}
				</ol>
			) : (
				<p className="empty">아직 이어진 소식이 없습니다. 새 소식이 나오면 여기에 표시됩니다.</p>
			)}

			{follow.quiet && (
				<div className="quiet">
					<p>30일 넘게 새 소식이 없습니다. 마무리된 일이라면 지켜보기를 그만둘 수 있습니다.</p>
					<div className="quiet-actions">
						<Button scheme="outline" size="small" onClick={onKeep}>
							계속 지켜보기
						</Button>
						<Button scheme="primary" size="small" onClick={onUnfollow}>
							정리하기
						</Button>
					</div>
				</div>
			)}
		</li>
	);
}

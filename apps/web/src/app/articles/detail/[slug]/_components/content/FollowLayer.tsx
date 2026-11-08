'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useFollowMutations, useNewsletterFollowUpdates, useNewsletterFollows } from '@/hooks/useFollows';
import { BellGlyph } from '@/components/common/icons/Glyphs';
import { cx } from '@/styles/tw';

interface Props {
	newsletterId: number;
	rootRef: RefObject<HTMLDivElement | null>;
	/** 본문 HTML. 바뀌면 자리를 다시 만든다 */
	content: string;
}

/**
 * 후속 지켜보기: 소식마다 끝에 단추 하나. 다 읽은 직후가 '그래서 어떻게 되는데?'가 남는 때라서.
 * 소식별 '관전 포인트'(p.next)가 있으면 그 줄 오른쪽 끝에 (무엇을 기다리는지 바로 옆에), 없으면(예전 뉴스레터) 출처 위에 한 줄로.
 * 켜 두면 이어지는 새 소식이 나왔을 때 마이페이지 '지켜보기'와 머리글에 알린다 (판정은 하루 한 번, 서버).
 * 거꾸로 이 소식이 내가 지켜보던 소식의 후속이면 소식 맨 위에 '지켜보던 소식의 후속'과 원래 소식을 보여 주고, 본 것으로 한다.
 * 본문은 React 밖 HTML이라, 소식마다 자리(span)를 만들어 그 안에 단추를 그린다
 */
/** '10월 31일' (한국 시각) */
const day = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(iso));

export default function FollowLayer({ newsletterId, rootRef, content }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { data: follows = [] } = useNewsletterFollows(newsletterId);
	const { data: updates = [] } = useNewsletterFollowUpdates(newsletterId);
	const { follow, unfollow, markSeen } = useFollowMutations();
	const [slots, setSlots] = useState<HTMLElement[]>([]);
	// 소식 맨 위: 지켜보던 소식의 후속 표시 자리
	const [tops, setTops] = useState<HTMLElement[]>([]);
	const marked = useRef<number | null>(null);
	// 방금 눌러 켠 소식: 그 종만 한 번 울린다
	const [rung, setRung] = useState<number | null>(null);

	// 다 울리면 풀어 둔다: 걸어 둔 채면 가리킬 때 같은 흔들림이 다시 재생되지 않는다
	useEffect(() => {
		if (rung === null) return;
		const timer = window.setTimeout(() => setRung(null), 700);
		return () => window.clearTimeout(timer);
	}, [rung]);

	// 여기서 본 후속은 본 것으로 (머리글 표시가 꺼짐), 뉴스레터마다 한 번
	useEffect(() => {
		if (marked.current === newsletterId || !updates.some((u) => !u.seenAt)) return;
		marked.current = newsletterId;
		markSeen.mutate(newsletterId);
	}, [updates, newsletterId, markSeen]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		let made: HTMLElement[] = [];
		// 예전 뉴스레터(소식별 관전 포인트 없음)는 따로 만든 줄
		let rows: HTMLElement[] = [];
		let heads: HTMLElement[] = [];
		const build = () => {
			made.forEach((slot) => slot.remove());
			rows.forEach((row) => row.remove());
			heads.forEach((head) => head.remove());
			rows = [];
			const stories = [...root.querySelectorAll('article.story')];
			heads = stories.map((story) => {
				const head = document.createElement('div');
				head.className = 'follow-from';
				story.prepend(head);
				return head;
			});
			setTops(heads);
			made = stories.map((story) => {
				const slot = document.createElement('span');
				slot.className = 'follow-slot';
				const next = story.querySelector('p.next');
				if (next) {
					next.appendChild(slot);
				} else {
					const row = document.createElement('div');
					row.className = 'follow-row';
					row.appendChild(slot);
					story.insertBefore(row, story.querySelector('p.credit'));
					rows.push(row);
				}
				return slot;
			});
			setSlots(made);
		};
		build();
		// 본문은 서버 렌더링 때 비어 있다가(sanitizeHtml은 브라우저에서만) 나중에 채워진다: 바뀌면 다시 만든다
		const observer = new MutationObserver(build);
		observer.observe(root, { childList: true });
		return () => {
			observer.disconnect();
			made.forEach((slot) => slot.remove());
			rows.forEach((row) => row.remove());
			heads.forEach((head) => head.remove());
		};
	}, [rootRef, content]);

	return (
		<>
			{tops.map((top, i) => {
				const from = updates.filter((u) => u.storyIndex === i + 1);
				if (!from.length) return null;
				return createPortal(
					<FollowFrom>
						<span className="label">
							<BellGlyph on />
							지켜보던 소식의 후속
						</span>
						{from.map((u) => (
							<Link key={u.id} href={`/articles/detail/${u.follow.newsletter.id}`} className="origin">
								<span className="date">{day(u.follow.newsletter.createdAt)}</span>
								{u.follow.heading}
							</Link>
						))}
					</FollowFrom>,
					top,
					`follow-from-${i + 1}`,
				);
			})}
			{slots.map((slot, i) => {
				const storyIndex = i + 1;
				const current = follows.find((f) => f.storyIndex === storyIndex);
				const busy = follow.isPending || unfollow.isPending;
				return createPortal(
					<FollowButton
						type="button"
						className={current ? 'on' : undefined}
						aria-pressed={!!current}
						disabled={busy}
						onClick={() => {
							if (!user) {
								openLogin('후속 기사를 받으려면 로그인해 주세요');
								return;
							}
							if (current) {
								unfollow.mutate(current.id);
								return;
							}
							setRung(storyIndex);
							follow.mutate({ newsletterId, storyIndex });
						}}
					>
						<BellGlyph on={!!current} ring={!!current && rung === storyIndex} />
						{current ? '지켜보는 중' : '후속 지켜보기'}
					</FollowButton>,
					slot,
					`follow-${storyIndex}`,
				);
			})}
		</>
	);
}

const FollowButton = ({ className, ...props }: React.ComponentProps<'button'>) => (
	<button className={cx('np-articles-follow-layer-follow-button', className)} {...props} />
);

/* 소식 맨 위: 이 소식이 이어 가는, 내가 지켜보던 원래 소식 (실선 대신 연한 바탕) */
const FollowFrom = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-articles-follow-layer-follow-from', className)} {...props} />
);

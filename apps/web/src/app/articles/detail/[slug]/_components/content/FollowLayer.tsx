'use client';

import { RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useAuth } from '@/hooks/useAuth';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import { useFollowMutations, useNewsletterFollows } from '@/hooks/useFollows';
import { BellGlyph } from '@/components/common/icons/Glyphs';

interface Props {
	newsletterId: number;
	rootRef: RefObject<HTMLDivElement | null>;
	/** 본문 HTML. 바뀌면 자리를 다시 만든다 */
	content: string;
}

/** 관전 포인트 n번째의 지켜보기 번호 (소식 번호와 겹치지 않게, API와 같다) */
export const WATCH_OFFSET = 1000;

type Slot = { el: HTMLElement; index: number; watch: boolean };

/**
 * 후속 지켜보기: 본문의 소식(article.story)마다 머리줄 오른쪽에, 관전 포인트(section.watch li)마다 끝에 단추.
 * 켜 두면 이어지는 새 소식이 나왔을 때 마이페이지 '지켜보기'와 머리글에 알린다 (판정은 하루 한 번, 서버).
 * 본문은 React 밖 HTML이라, 소식 · 관전 포인트마다 자리(span)를 만들어 그 안에 단추를 그린다
 */
export default function FollowLayer({ newsletterId, rootRef, content }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { data: follows = [] } = useNewsletterFollows(newsletterId);
	const { follow, unfollow } = useFollowMutations();
	const [slots, setSlots] = useState<Slot[]>([]);
	// 방금 눌러 켠 자리: 그 종만 한 번 울린다
	const [rung, setRung] = useState<number | null>(null);

	// 다 울리면 풀어 둔다: 걸어 둔 채면 가리킬 때 같은 흔들림이 다시 재생되지 않는다
	useEffect(() => {
		if (rung === null) return;
		const timer = window.setTimeout(() => setRung(null), 700);
		return () => window.clearTimeout(timer);
	}, [rung]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		let made: Slot[] = [];
		const slotIn = (parent: Element, className: string) => {
			const el = document.createElement('span');
			el.className = className;
			parent.appendChild(el);
			return el;
		};
		const build = () => {
			made.forEach((slot) => slot.el.remove());
			made = [
				...[...root.querySelectorAll('article.story')].map((story, i) => ({
					el: slotIn(story.querySelector('.kicker') ?? story, 'follow-slot'),
					index: i + 1,
					watch: false,
				})),
				// 관전 포인트도 '앞으로 지켜볼 일'이라 하나씩 지켜볼 수 있다
				...[...root.querySelectorAll('section.watch li')].map((item, i) => ({
					el: slotIn(item, 'follow-slot watch-slot'),
					index: WATCH_OFFSET + i + 1,
					watch: true,
				})),
			];
			setSlots(made);
		};
		build();
		// 본문은 서버 렌더링 때 비어 있다가(sanitizeHtml은 브라우저에서만) 나중에 채워진다: 바뀌면 다시 만든다
		const observer = new MutationObserver(build);
		observer.observe(root, { childList: true });
		return () => {
			observer.disconnect();
			made.forEach((slot) => slot.el.remove());
		};
	}, [rootRef, content]);

	return (
		<>
			{slots.map(({ el, index, watch }) => {
				const current = follows.find((f) => f.storyIndex === index);
				const busy = follow.isPending || unfollow.isPending;
				return createPortal(
					<FollowButton
						type="button"
						className={current ? 'on' : undefined}
						aria-pressed={!!current}
						aria-label={watch ? (current ? '이 관전 포인트 지켜보는 중' : '이 관전 포인트 후속 지켜보기') : undefined}
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
							setRung(index);
							follow.mutate({ newsletterId, storyIndex: index });
						}}
					>
						<BellGlyph on={!!current} ring={!!current && rung === index} />
						{current ? '지켜보는 중' : '후속 지켜보기'}
						{current && current._count.updates > 0 && <span className="count">후속 {current._count.updates}</span>}
					</FollowButton>,
					el,
					`follow-${index}`,
				);
			})}
		</>
	);
}

const FollowButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	margin: 0;
	padding: 0.25rem 0.625rem;
	/* 눈에 띄게: 강조색 테두리 · 글자 (지켜보는 중이면 강조색으로 채운다) */
	border: 1px solid ${({ theme }) => theme.color.primary};
	border-radius: ${({ theme }) => theme.radius.chip};
	background: ${({ theme }) => theme.color.background};
	font-size: 0.75rem;
	font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	letter-spacing: 0;
	color: ${({ theme }) => theme.color.primary};
	white-space: nowrap;
	cursor: pointer;
	transition:
		color 0.15s ease,
		background 0.15s ease;

	line-height: 1.25;

	/* 본문 공통 * { margin-bottom }이 아이콘을 위로 밀지 않게 · inline 기준선 대신 단추 가운데에 */
	svg {
		display: block;
		flex-shrink: 0;
		margin: 0;
		width: 0.875rem;
		height: 0.875rem;
	}

	&:hover:not(:disabled) {
		background: ${({ theme }) => theme.color.tertiary};
	}

	&.on {
		background: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.background};
	}

	/* 켜진 단추를 가리켜도 채운 바탕 그대로 (연한 바탕이 덮이면 흰 글자가 안 보인다), 조금 옅게만 */
	&.on:hover:not(:disabled) {
		background: ${({ theme }) => theme.color.primary};
		opacity: 0.85;
	}

	&:disabled {
		cursor: progress;
		opacity: 0.6;
	}

	.count {
		margin: 0 0 0 0.125rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
	}
`;

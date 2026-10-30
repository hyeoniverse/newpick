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

/**
 * 후속 지켜보기: 본문의 소식(article.story)마다 머리줄 오른쪽에 단추.
 * 켜 두면 이어지는 새 소식이 나왔을 때 마이페이지 '지켜보기'와 머리글에 알린다 (판정은 하루 한 번, 서버).
 * 본문은 React 밖 HTML이라, 소식마다 자리(span)를 만들어 그 안에 단추를 그린다
 */
export default function FollowLayer({ newsletterId, rootRef, content }: Props) {
	const { user } = useAuth();
	const openLogin = useOpenLogin();
	const { data: follows = [] } = useNewsletterFollows(newsletterId);
	const { follow, unfollow } = useFollowMutations();
	const [slots, setSlots] = useState<HTMLElement[]>([]);
	// 방금 눌러 켠 소식: 그 종만 한 번 울린다
	const [rung, setRung] = useState<number | null>(null);

	useEffect(() => {
		const root = rootRef.current;
		if (!root) return;
		let made: HTMLElement[] = [];
		const build = () => {
			made.forEach((slot) => slot.remove());
			made = [...root.querySelectorAll('article.story')].map((story) => {
				const head = story.querySelector('.kicker') ?? story;
				const slot = document.createElement('span');
				slot.className = 'follow-slot';
				head.appendChild(slot);
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
		};
	}, [rootRef, content]);

	return (
		<>
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
						{current && current._count.updates > 0 && <span className="count">후속 {current._count.updates}</span>}
					</FollowButton>,
					slot,
					`follow-${storyIndex}`,
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
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.chip};
	background: ${({ theme }) => theme.color.background};
	font-size: 0.75rem;
	font-weight: ${({ theme }) => theme.fontWeight.medium};
	letter-spacing: 0;
	color: ${({ theme }) => theme.color.subText};
	white-space: nowrap;
	cursor: pointer;
	transition:
		color 0.15s ease,
		border-color 0.15s ease;

	line-height: 1.25;

	/* 본문 공통 * { margin-bottom }이 아이콘을 위로 밀지 않게 · inline 기준선 대신 단추 가운데에 */
	svg {
		display: block;
		flex-shrink: 0;
		margin: 0;
		width: 0.875rem;
		height: 0.875rem;
	}

	&:hover:not(:disabled),
	&.on {
		border-color: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.primary};
	}

	&.on {
		background: ${({ theme }) => theme.color.tertiary};
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

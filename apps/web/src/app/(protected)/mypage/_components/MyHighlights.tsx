'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { LuHighlighter } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { Highlight, useHighlightMutations, useHighlights } from '@/hooks/useHighlights';
import { useModal } from '@/hooks/useModal';
import ModalContents from '@/components/common/modal/ModalContent';
import { dateFormatter } from '@/utils/formatter';
import MyTaste from './MyTaste';

/** 구역 이름표 → 보이는 이름 */
const sectionLabel = (section: string | null) => {
	if (section === 'briefing') return '에디터 브리핑';
	const story = section?.match(/^story-(\d+)$/);
	return story ? `소식 ${story[1]}` : null;
};

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 뉴스레터별로 모아 본다.
 * 메모 고치기 · 지우기, '원문에서 보기'는 상세 페이지의 그 문장으로 (?hl=번호)
 */
export default function MyHighlights() {
	const { data, isPending, isError, error, refetch } = useHighlights();
	// 스크랩 알림의 '모아 보기'로 오면(#hl-번호) 그 문장으로 스크롤하고 잠깐 강조
	const [focused, setFocused] = useState<number | null>(null);
	useEffect(() => {
		const target = Number(window.location.hash.match(/^#hl-(\d+)$/)?.[1]);
		if (!target || !data?.some((h) => h.id === target)) return;
		document.getElementById(`hl-${target}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
		setFocused(target);
		const timer = window.setTimeout(() => setFocused(null), 2400);
		return () => window.clearTimeout(timer);
	}, [data]);

	if (isPending) return <Skeleton />;
	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;
	if (data.length === 0) {
		// 스크랩이 없어도 북마크로 모인 주제는 보인다
		return (
			<StyledHighlights>
				<MyTaste />
				<EmptyState
					icon={LuHighlighter}
					title="스크랩한 문장이 없어요"
					description="뉴스레터를 읽다가 중요한 문장을 드래그해 스크랩하거나 메모를 남기면 여기에 모여요."
					action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
				/>
			</StyledHighlights>
		);
	}

	// 뉴스레터별로 묶기 (가장 최근에 스크랩한 뉴스레터부터)
	const groups = new Map<number, Highlight[]>();
	for (const highlight of data)
		groups.set(highlight.newsletterId, [...(groups.get(highlight.newsletterId) ?? []), highlight]);

	return (
		<StyledHighlights>
			<MyTaste />
			<p className="count">
				뉴스레터 {groups.size}편 · 문장 {data.length}개 · 메모 {data.filter((h) => h.note).length}개
			</p>
			{[...groups.entries()].map(([newsletterId, items]) => {
				const newsletter = items[0].newsletter;
				return (
					<section key={newsletterId} className="group" aria-label={newsletter?.title}>
						<header>
							{newsletter && <span className="category">{newsletter.category.name}</span>}
							<Link href={`/articles/detail/${newsletterId}`} className="title">
								{newsletter?.title ?? `뉴스레터 #${newsletterId}`}
							</Link>
							{newsletter && <span className="date">{dateFormatter(newsletter.createdAt)}</span>}
						</header>
						<ul>
							{items.map((highlight) => (
								<HighlightItem key={highlight.id} highlight={highlight} focused={highlight.id === focused} />
							))}
						</ul>
					</section>
				);
			})}
		</StyledHighlights>
	);
}

function HighlightItem({ highlight, focused }: { highlight: Highlight; focused: boolean }) {
	const { update, remove } = useHighlightMutations();
	const { openModal, closeModal } = useModal();
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState(highlight.note ?? '');
	const label = sectionLabel(highlight.section);

	const confirmRemove = () =>
		openModal(
			<ModalContents
				title="이 스크랩을 지울까요?"
				content={highlight.note ? '메모도 함께 지워져요.' : '문장만 지워지고 뉴스레터는 그대로예요.'}
				outlineButton="취소"
				filledButton="지우기"
				onCancelClick={closeModal}
				onConfirmClick={() => {
					closeModal();
					remove.mutate(highlight.id);
				}}
			/>,
		);

	return (
		<li id={`hl-${highlight.id}`} className={focused ? 'focused' : undefined}>
			<blockquote>{highlight.text}</blockquote>
			{editing ? (
				<form
					className="edit"
					onSubmit={(event) => {
						event.preventDefault();
						update.mutate({ id: highlight.id, note }, { onSuccess: () => setEditing(false) });
					}}
				>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={3}
						maxLength={2000}
						placeholder="이 문장에 대한 내 생각"
						aria-label="메모"
						autoFocus
					/>
					<div className="actions">
						<button
							type="button"
							onClick={() => {
								setNote(highlight.note ?? '');
								setEditing(false);
							}}
						>
							취소
						</button>
						<button type="submit" className="primary" disabled={update.isPending}>
							저장
						</button>
					</div>
				</form>
			) : (
				highlight.note && <p className="note">{highlight.note}</p>
			)}
			<div className="meta">
				{label && <span>{label}</span>}
				<span>{dateFormatter(highlight.createdAt)}</span>
				<Link href={`/articles/detail/${highlight.newsletterId}?hl=${highlight.id}`}>원문에서 보기</Link>
				{!editing && (
					<button type="button" onClick={() => setEditing(true)}>
						{highlight.note ? '메모 고치기' : '메모 남기기'}
					</button>
				)}
				<button type="button" className="danger" onClick={confirmRemove}>
					지우기
				</button>
			</div>
		</li>
	);
}

const StyledHighlights = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding: 2rem 0;

	.count {
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		header {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0.25rem 0.75rem;
		}

		.category {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

		.title {
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;

			&:hover {
				text-decoration: underline;
			}
		}

		.date {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 스크랩 목록만 (위의 '요즘 관심 있게 본 주제' 카드에는 붙지 않게) */
	.group ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.group li {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0.75rem;
		margin: 0 -0.75rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		scroll-margin-top: 6rem;
		transition: background-color 0.4s;

		/* 알림에서 바로 온 문장 */
		&.focused {
			background: ${({ theme }) => theme.color.tertiary};
		}
	}

	blockquote {
		margin: 0;
		padding: 0.125rem 0 0.125rem 0.875rem;
		border-left: 3px solid ${({ theme }) => theme.color.primary};
		line-height: 1.7;
		color: ${({ theme }) => theme.color.text};
		word-break: keep-all;
	}

	.note {
		padding: 0.625rem 0.875rem;
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		white-space: pre-wrap;
		color: ${({ theme }) => theme.color.text};
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		a,
		button {
			color: ${({ theme }) => theme.color.primary};
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}
		}

		.danger {
			color: ${({ theme }) => theme.color.error};
		}
	}

	.edit {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		textarea {
			width: 100%;
			padding: 0.625rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.text};
			font: inherit;
			line-height: 1.6;
			resize: vertical;

			&:focus {
				outline: none;
				border-color: ${({ theme }) => theme.color.primary};
			}
		}

		.actions {
			display: flex;
			justify-content: flex-end;
			gap: 0.375rem;

			button {
				padding: 0.375rem 0.875rem;
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.control};
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.text};
				cursor: pointer;

				&.primary {
					border-color: ${({ theme }) => theme.color.primary};
					background: ${({ theme }) => theme.color.primary};
					color: ${({ theme }) => theme.color.white};
				}
			}
		}
	}
`;

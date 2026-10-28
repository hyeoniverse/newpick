'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { LuHighlighter } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FilterChips from '@/components/common/FilterChips';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import { Highlight, useHighlightMutations, useHighlights } from '@/hooks/useHighlights';
import { useModal } from '@/hooks/useModal';
import ModalContents from '@/components/common/modal/ModalContent';
import { dateFormatter } from '@/utils/formatter';
import MyTaste from './MyTaste';

/**
 * 구역 이름: 브리핑은 '에디터 브리핑', 소식은 뉴스레터 본문처럼 번호(01) + 그 소식의 제목.
 * ('소식 2'만으로는 무엇을 가리키는지 몰라서)
 */
function SectionLabel({ highlight }: { highlight: Highlight }) {
	if (highlight.section === 'briefing') return <p className="section">에디터 브리핑</p>;
	const story = highlight.section?.match(/^story-(\d+)$/);
	if (!story) return <p className="section">본문</p>;
	return (
		<p className="section">
			<span className="index">{story[1].padStart(2, '0')}</span>
			{highlight.sectionTitle ?? `소식 ${story[1]}`}
		</p>
	);
}

/** 본문 순서: 브리핑 → 소식 1 → 소식 2 … → 구역 모름 */
const sectionOrder = (section: string | null) => {
	if (section === 'briefing') return 0;
	const story = section?.match(/^story-(\d+)$/);
	return story ? Number(story[1]) : 999;
};

const FILTERS = [
	{ value: '', label: '전체' },
	{ value: 'memo', label: '메모만' },
];

/**
 * 마이페이지 스크랩 (#123 1단계): 뉴스레터 본문에서 스크랩한 문장 · 메모를 모아 본다.
 * 뉴스레터별(가장 최근에 스크랩한 것부터)로 묶고, 그 안은 본문 순서(브리핑 → 소식 N)로 구역마다 한 번만 이름을 단다.
 * 문장 아래 원문에서 보기(?hl=번호) · 메모 · 지우기
 */
export default function MyHighlights() {
	const { data, isPending, isError, error, refetch } = useHighlights();
	const [filter, setFilter] = useState('');
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

	const memos = data.filter((h) => h.note).length;
	const shown = filter === 'memo' ? data.filter((h) => h.note) : data;
	// 뉴스레터별 (목록이 최근 것부터라 처음 나온 순서 = 가장 최근에 스크랩한 뉴스레터부터)
	const groups = new Map<number, Highlight[]>();
	for (const highlight of shown)
		groups.set(highlight.newsletterId, [...(groups.get(highlight.newsletterId) ?? []), highlight]);

	return (
		<StyledHighlights>
			<MyTaste />
			<div className="list-head">
				<h3>
					모은 문장 <span className="count">{data.length}</span>
				</h3>
				<FilterChips
					label="보기"
					options={FILTERS.map((f) => (f.value === 'memo' ? { ...f, label: `메모만 ${memos}` } : f))}
					value={filter}
					onChange={setFilter}
				/>
			</div>
			{shown.length === 0 && <p className="empty">메모를 남긴 문장이 없어요. 문장의 연필을 눌러 메모를 남겨 보세요.</p>}
			{[...groups.entries()].map(([newsletterId, items]) => {
				const newsletter = items[0].newsletter;
				// 본문 순서로, 같은 구역은 먼저 스크랩한 것부터
				const sorted = [...items].sort(
					(a, b) => sectionOrder(a.section) - sectionOrder(b.section) || a.createdAt.localeCompare(b.createdAt),
				);
				return (
					<section key={newsletterId} className="group" aria-label={newsletter?.title}>
						<div className="group-head">
							<div className="eyebrow">
								{newsletter && <span className="category">{newsletter.category.name}</span>}
								{newsletter && <span className="date">{dateFormatter(newsletter.createdAt)}</span>}
							</div>
							<Link href={`/articles/detail/${newsletterId}`} className="title">
								{newsletter?.title ?? `뉴스레터 #${newsletterId}`}
							</Link>
						</div>
						<ul>
							{sorted.map((highlight, i) => (
								<li key={highlight.id}>
									{/* 구역이 바뀔 때만 이름 */}
									{(i === 0 || sorted[i - 1].section !== highlight.section) && <SectionLabel highlight={highlight} />}
									<HighlightItem highlight={highlight} focused={highlight.id === focused} />
								</li>
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
		<article
			id={`hl-${highlight.id}`}
			className={`item ${focused ? 'focused' : ''}`}
			title={`${dateFormatter(highlight.createdAt)} 스크랩`}
		>
			{/* 스크랩한 문장만 따옴표 칸만큼 들여 쓴다 */}
			<span className="quote-mark" aria-hidden>
				“
			</span>
			<p className="quote">
				<span>{highlight.text}</span>
			</p>
			<div className="tools">
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
				highlight.note && (
					<p className="note">
						<span className="note-label">메모</span>
						{highlight.note}
					</p>
				)
			)}
		</article>
	);
}

const StyledHighlights = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
	padding: 2rem 0;

	/* 목록 머리: '모은 문장 N' · 전체 / 메모만 */
	.list-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		margin-top: 1rem;

		h3 {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.count {
			margin-left: 0.25rem;
			color: ${({ theme }) => theme.color.primary};
		}

		/* 칩 두 개뿐이라 '보기' 이름표는 화면에서 빼고 묶음 이름(aria-label)으로만 */
		.chips-label {
			display: none;
		}
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem 1.5rem 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 1rem 1rem 0.5rem;
		}
	}

	.group-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		.eyebrow {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		.category {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

		.date {
			color: ${({ theme }) => theme.color.subText};
		}

		.title {
			width: fit-content;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}
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

	/* 구역 이름 (에디터 브리핑 · 소식 N): 바뀔 때만 */
	.section {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		margin: 0 0 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.subText};
		word-break: keep-all;

		/* 뉴스레터 본문의 소식 번호와 같은 모양 */
		.index {
			flex-shrink: 0;
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
			font-variant-numeric: tabular-nums;
		}
	}

	/* 문장 한 개: 문장만 따옴표 칸만큼 들이고, 메모 · 글자 동작은 왼쪽 끝 */
	/* 문장 사이 가는 구분선 (구역 이름도 선 아래에) */
	.group li {
		padding: 0.875rem 0;
	}

	.group li + li {
		border-top: 1px solid ${({ theme }) => theme.color.border};
	}

	.item {
		display: grid;
		grid-template-columns: 1.5rem minmax(0, 1fr);
		grid-template-areas:
			'mark quote'
			'note note'
			'tools tools';
		gap: 0.375rem 0.25rem;
		scroll-margin-top: 6rem;

		/* 알림에서 바로 온 문장: 잠깐 배경으로 표시 */
		&.focused .quote span {
			background-color: color-mix(in srgb, ${({ theme }) => theme.color.primary} 14%, transparent);
		}
	}

	/* 문장이 먼저 보이게: 메모 · 동작보다 굵고 진하게 */
	/* 따옴표 칸 */
	/* 문장 첫머리에 살짝 걸치는 장식 따옴표: 세리프 글꼴의 가는 곡선 모양, 옅게 글자 뒤에 */
	.quote-mark {
		grid-area: mark;
		z-index: 0;
		/* 위아래로 넘친 만큼 빼서 줄 높이에 영향을 주지 않게 */
		height: 0;
		margin-top: -0.375rem;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 3.25rem;
		line-height: 1;
		color: ${({ theme }) => theme.color.primary};
		opacity: 0.28;
		/* 칸에서 문장 쪽으로 밀어 첫 글자에 살짝 걸치게 */
		transform: translateX(0.5rem);
		user-select: none;
		pointer-events: none;
	}

	.quote {
		position: relative;
		z-index: 1;
		grid-area: quote;
		margin: 0;
		font-weight: ${({ theme }) => theme.fontWeight.regular};
		line-height: 1.75;
		color: ${({ theme }) => theme.color.text};
		word-break: keep-all;

		span {
			border-radius: 2px;
			transition: background-color 0.4s;
		}
	}

	/* 메모: 상자 없이 '메모' 이름표 + 글 */
	.note {
		grid-area: note;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		white-space: pre-wrap;
		color: ${({ theme }) => theme.color.mediumGrey};

		.note-label {
			margin-right: 0.5rem;
			font-size: 0.75rem;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}
	}

	/* 글자 동작 */
	.tools {
		grid-area: tools;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};

		a,
		button {
			padding: 0;
			font: inherit;
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}
		}

		.danger:hover {
			color: ${({ theme }) => theme.color.error};
		}
	}

	.edit {
		grid-area: note;
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
				font: inherit;
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

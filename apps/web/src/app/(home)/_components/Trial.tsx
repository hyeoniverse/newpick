import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { CATEGORIES } from '@/constants/categories';
import { ArticleDetail } from '@/models/article.model';
import { fetchTrendList } from '@/api/article';
import { useModal } from '@/hooks/useModal';
import { useOpenSubscribe } from '@/hooks/useOpenSubscribe';
import { getFirstImage } from '@/utils/getFirstImage';
import { stripCodeFence } from '@/utils/stripCodeFence';

import styled from 'styled-components';
import { LuCircleAlert, LuMailOpen } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Skeleton from '@/components/common/loader/Skeleton';

/** 분야별 최신 발행본. 부제·키워드는 #45 이후 발행본에만 있다 */
type Latest = ArticleDetail & { subtitle?: string | null; keywords?: string[] | null };

const INTERESTS = CATEGORIES.slice(1).map((c) => c.name);

const monthDay = (date: string) =>
	new Date(date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

/**
 * 체험하기 = 내 뉴스레터 미리보기 (#54).
 * 생성하지 않고 분야별 최신 발행본으로, 구독하면 받을 메일을 그대로 보여 준다 (Claude 호출 없음, 비용 0).
 * '이 구성으로 구독하기'는 고른 분야가 미리 선택된 구독 시트를 연다
 */
export default function Trial() {
	const [selected, setSelected] = useState<string[]>(['IT']);
	const { closeModal } = useModal();
	const openSubscribe = useOpenSubscribe();

	const { data, isLoading, isError, refetch } = useQuery<Latest[]>({
		queryKey: ['trends', 'latest-raw'],
		queryFn: () => fetchTrendList() as Promise<Latest[]>,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});

	const toggle = (name: string) =>
		setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
	const isAll = selected.length === INTERESTS.length;

	// 고른 순서가 아니라 분야 순서대로
	const picked = INTERESTS.filter((name) => selected.includes(name)).map((name) => ({
		name,
		newsletter: data?.find((n) => CATEGORIES.find((c) => c.id === n.categoryId)?.name === name),
	}));
	const published = picked.filter((p) => p.newsletter);
	const latestDate = published
		.map((p) => p.newsletter!.createdAt)
		.sort()
		.at(-1);

	return (
		<StyledTrial>
			<div className="header">
				<Title size="small" weight="bold">
					내 뉴스레터 미리보기
				</Title>
				<Text size="small" color="subText">
					관심 분야를 고르면, 구독했을 때 받을 메일을 최신 발행본으로 보여 드려요.
				</Text>
				<div className="chips" role="group" aria-label="관심 분야">
					<button
						type="button"
						className={isAll ? 'chip selected' : 'chip'}
						aria-pressed={isAll}
						onClick={() => setSelected(isAll ? [] : INTERESTS)}
					>
						전체
					</button>
					{INTERESTS.map((name) => (
						<button
							key={name}
							type="button"
							className={selected.includes(name) ? 'chip selected' : 'chip'}
							aria-pressed={selected.includes(name)}
							onClick={() => toggle(name)}
						>
							{name}
						</button>
					))}
				</div>
			</div>

			<StyledMail aria-live="polite" aria-busy={isLoading}>
				{isLoading ? (
					<Skeleton />
				) : isError ? (
					<div className="info">
						<span className="badge error">
							<LuCircleAlert />
						</span>
						<Text size="medium" weight="semiBold">
							뉴스레터를 불러오지 못했어요
						</Text>
						<Button scheme="outline" size="small" onClick={() => refetch()}>
							다시 불러오기
						</Button>
					</div>
				) : !selected.length ? (
					<div className="info">
						<span className="badge">
							<LuMailOpen />
						</span>
						<Text size="medium" weight="semiBold">
							관심 분야를 하나 이상 골라 주세요
						</Text>
					</div>
				) : !published.length ? (
					<div className="info">
						<span className="badge">
							<LuMailOpen />
						</span>
						<Text size="medium" weight="semiBold">
							아직 발행된 뉴스레터가 없어요
						</Text>
						<Text size="small" color="subText">
							뉴스레터는 매일 아침 8시 30분쯤 발행돼요.
						</Text>
					</div>
				) : (
					<article className="mail">
						<header className="mail-head">
							<span className="avatar" aria-hidden>
								NP
							</span>
							<div>
								<p className="from">뉴픽 NewPick</p>
								<h3 className="subject">
									{latestDate && `${monthDay(latestDate)} `}뉴픽 · {published.length}개 분야
								</h3>
							</div>
						</header>
						{picked.map(({ name, newsletter }) =>
							newsletter ? (
								<section key={name} className="item">
									<div className="text">
										<p className="category">{name}</p>
										<Link href={`/articles/detail/${newsletter.id}`} className="title" onClick={closeModal}>
											{stripCodeFence(newsletter.title)}
										</Link>
										{newsletter.subtitle && <p className="subtitle">{newsletter.subtitle}</p>}
										<p className="summary">{stripCodeFence(newsletter.content)}</p>
										{!!newsletter.keywords?.length && (
											<p className="keywords">
												{newsletter.keywords
													.slice(0, 4)
													.map((k) => `#${k}`)
													.join(' ')}
											</p>
										)}
									</div>
									{getFirstImage(newsletter.imageUrl ?? '') && (
										// 메일 미리보기라 next/image 대신 원본 그대로 (원출처 사진)
										// eslint-disable-next-line @next/next/no-img-element
										<img className="thumb" src={getFirstImage(newsletter.imageUrl ?? '')!} alt="" loading="lazy" />
									)}
								</section>
							) : (
								<section key={name} className="item pending">
									<p className="category">{name}</p>
									<Text size="small" color="subText">
										아직 발행 전이에요. 발행되면 함께 보내 드려요.
									</Text>
								</section>
							),
						)}
					</article>
				)}
			</StyledMail>

			<Button
				size="medium"
				scheme="primary"
				className="subscribe"
				disabled={!selected.length}
				onClick={() => openSubscribe(isAll ? CATEGORIES.map((c) => c.name) : selected)}
			>
				{selected.length
					? `이 구성으로 구독하기 (${isAll ? '전체' : `${selected.length}개 분야`})`
					: '분야를 골라 주세요'}
			</Button>
		</StyledTrial>
	);
}

const StyledTrial = styled.div`
	/* 넓은 시트(large) 안을 채운다. 시트 최대 높이 85vh에서 위아래 여백을 뺀 만큼 */
	width: 100%;
	height: min(46rem, calc(85vh - 4rem));
	display: flex;
	flex-direction: column;
	gap: 1.25rem;

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.chip {
		padding: 0.375rem 0.875rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};
		cursor: pointer;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}

		&.selected {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.background};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}

	.subscribe {
		flex-shrink: 0;
		width: 100%;
		height: 3rem;
		border-radius: ${({ theme }) => theme.radius.control};
	}
`;

/** 받은편지함에서 연 메일 모양 */
const StyledMail = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: 1.25rem;
	border-radius: ${({ theme }) => theme.radius.surface};
	background: ${({ theme }) => theme.color.surface};

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		padding: 0.75rem;
	}

	.info {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-align: center;
		word-break: keep-all;

		.badge {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 0.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.75rem;
				height: 1.75rem;
			}

			&.error {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}

	.mail {
		max-width: 40rem;
		margin: 0 auto;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
	}

	.mail-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		.avatar {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2.5rem;
			height: 2.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.background};
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}

		.from {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}

		.subject {
			margin: 0.125rem 0 0;
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}
	}

	.item {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		&:last-child {
			border-bottom: none;
		}

		&.pending {
			flex-direction: column;
			gap: 0.25rem;
		}

		.text {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		.category {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.primary};
		}

		.title {
			font-size: ${({ theme }) => theme.fontSize.medium};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			line-height: 1.4;
			color: ${({ theme }) => theme.color.text};
			word-break: keep-all;

			&:hover {
				text-decoration: underline;
			}
		}

		.subtitle,
		.summary,
		.keywords {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.small};
			line-height: 1.6;
		}

		.subtitle {
			color: ${({ theme }) => theme.color.mediumGrey};
		}

		.summary {
			color: ${({ theme }) => theme.color.subText};
			display: -webkit-box;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.keywords {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.primary};
		}

		.thumb {
			flex-shrink: 0;
			width: 7rem;
			aspect-ratio: 4 / 3;
			object-fit: cover;
			border-radius: ${({ theme }) => theme.radius.surface};

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				width: 5rem;
			}
		}
	}
`;

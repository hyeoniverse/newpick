'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuMailPlus, LuMail } from 'react-icons/lu';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import { useTab } from '@/hooks/useTab';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import MyMailSheet from '@/app/(protected)/mypage/_components/subscribe/MyMailSheet';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import Pagination from '@/components/common/Pagination';
import BrandAvatar from '@/components/common/BrandAvatar';
import { errorStateFor, statusOf } from '@/constants/errors';

/** 한 쪽에 메일 몇 통 */
const PAGE_SIZE = 5;

interface MailNewsletter {
	id: number;
	title: string;
	subtitle: string | null;
	image: string | null;
	summary: string | null;
	createdAt: string;
	category: { id: number; name: string };
}

interface Mail {
	sentAt: string;
	/** 메일 제목 (발송 때와 같은 방식으로 다시 만든 것) */
	subject: string | null;
	newsletters: MailNewsletter[];
}

/** '10월 27일 (월) 오전 8:40' (한국 시각) */
const sentText = (iso: string) =>
	new Intl.DateTimeFormat('ko-KR', {
		timeZone: 'Asia/Seoul',
		month: 'long',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(iso));

/**
 * 내 뉴스레터: 내가 실제로 받은 메일함 (보낸 시각별 한 통씩, 최신부터). 누르면 받은 그대로의 메일.
 * 예전엔 오늘 내 관심사 뉴스레터를 보여 줘, 관심사를 바꾼 뒤엔 받은 적 없는 것이 섞였다
 */
export default function MySubscribe() {
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const { status: isSubscribed = user?.isSubscribed } = useSubscribe();
	const { openModal } = useModal();
	const [page, setPage] = useState(1);

	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: ['myMails', user?.id, page],
		queryFn: () =>
			apiFetch<{ items: Mail[]; total: number }>(API_ENDPOINTS.MY.MAILS((page - 1) * PAGE_SIZE, PAGE_SIZE)),
		enabled: !!user,
		placeholderData: (previous) => previous,
	});

	if (!user || isPending) {
		return (
			<MySubscribeStyled aria-busy>
				<div className="cards">
					<Skeleton />
				</div>
			</MySubscribeStyled>
		);
	}

	if (isError) return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;

	if (data.total === 0) {
		// 받은 메일이 없으면: 구독 중이면 기다리라고, 아니면 구독하라고
		return isSubscribed === null ? (
			<EmptyState
				icon={LuMailPlus}
				title="아직 구독하지 않았어요"
				description={'관심사를 고르면 매일 아침 8시 40분에\n그 관심사만 엮은 뉴스레터를 보내 드려요.'}
				action={{ label: '구독 시작하기', onClick: () => setActiveTab('settings') }}
			/>
		) : (
			<EmptyState
				icon={LuMail}
				title="아직 받은 메일이 없어요"
				description={'매일 아침 8시 40분에 첫 메일이 가요.\n보낸 메일은 여기에 날짜별로 모여요.'}
				action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
			/>
		);
	}

	return (
		<MySubscribeStyled>
			{/* 받은편지함: 한 줄이 메일 한 통. 누르면 받은 그대로의 메일을 시트로 */}
			<ul className="inbox">
				{data.items.map((mail) => (
					<li key={mail.sentAt}>
						<button
							type="button"
							className="mail-row"
							onClick={() => openModal(<MyMailSheet sentAt={mail.sentAt} />, { size: 'large' })}
						>
							<BrandAvatar />
							<span className="body">
								<span className="subject">{mail.subject ?? mail.newsletters[0]?.title}</span>
								<span className="meta">
									{mail.newsletters.map((n) => n.category.name).join(' · ')} · 뉴스레터 {mail.newsletters.length}편
								</span>
							</span>
							<time className="sent" dateTime={mail.sentAt}>
								{sentText(mail.sentAt)}
							</time>
						</button>
					</li>
				))}
			</ul>
			<Pagination
				className="pagination"
				page={page}
				total={data.total}
				pageSize={PAGE_SIZE}
				onChange={(next) => {
					setPage(next);
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			/>
		</MySubscribeStyled>
	);
}

const MySubscribeStyled = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;
	padding: 2rem 0;

	.inbox {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid ${({ theme }) => theme.color.border};
	}

	li {
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	/* 받은편지함 한 줄: 보낸 사람 · 제목 · 담긴 관심사 · 받은 시각 */
	.mail-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 1.125rem 0.5rem;
		text-align: left;
		cursor: pointer;

		&:hover {
			background: ${({ theme }) => theme.color.surface};

			.subject {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.subject {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};
	}

	.meta {
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.sent {
		flex-shrink: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.mail-row {
			flex-wrap: wrap;
			padding: 1rem 0.25rem;
		}

		.sent {
			flex-basis: 100%;
			padding-left: 3.5rem;
		}
	}
`;

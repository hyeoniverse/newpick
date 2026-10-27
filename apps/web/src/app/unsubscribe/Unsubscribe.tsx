'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import styled, { keyframes } from 'styled-components';
import { LuMailX, LuMailCheck, LuLink2Off, LuX, LuCheck } from 'react-icons/lu';
import { apiFetch, ApiError } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/loader/Spinner';

type Target = { email: string; subscribed: boolean };

/** 해지하면 멈추는 것 / 그대로 남는 것 */
const STOPS = ['매일 아침 8시 40분 뉴스레터 메일', '고른 관심사 설정'];
const KEEPS = ['뉴픽 계정과 북마크', '사이트에서 뉴스레터 읽기'];

/**
 * 수신 거부 화면 (#18). 오류 화면 · 로그인 창과 같은 가운데 정렬 구성.
 * 링크를 여는 것만으로는 해지하지 않고(메일 보안 검사기가 미리 열어 봄) '해지하기'를 눌러야 해지한다
 */
export default function Unsubscribe() {
	const router = useRouter();
	const token = useSearchParams().get('token') ?? '';
	const [done, setDone] = useState(false);
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState<string | null>(null);

	const { data, error, isLoading } = useQuery({
		queryKey: ['unsubscribe', token],
		queryFn: () => apiFetch<{ data: Target }>(API_ENDPOINTS.SUBSCRIBERS.UNSUBSCRIBE(token)).then((r) => r.data),
		enabled: Boolean(token),
		retry: false,
	});

	const unsubscribe = async () => {
		setPending(true);
		setFailed(null);
		try {
			await apiFetch(API_ENDPOINTS.SUBSCRIBERS.UNSUBSCRIBE(token), { method: 'POST' });
			setDone(true);
		} catch (e) {
			setFailed(e instanceof ApiError ? e.message : '해지하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
		} finally {
			setPending(false);
		}
	};

	if (token && isLoading) {
		return (
			<StyledUnsubscribe>
				<Spinner />
			</StyledUnsubscribe>
		);
	}

	if (!token || error || !data) {
		return (
			<StyledUnsubscribe>
				<span className="badge" aria-hidden>
					<LuLink2Off />
				</span>
				<p className="eyebrow">수신 거부</p>
				<h1 className="title">링크가 올바르지 않아요</h1>
				<p className="description">
					메일 아래쪽의 &quot;수신 거부&quot;를 다시 눌러 주세요. 로그인했다면 마이페이지에서도 해지할 수 있어요.
				</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push('/mypage?tab=settings')}>
						마이페이지에서 해지
					</Button>
					<Button scheme="outline" size="medium" onClick={() => router.push('/')}>
						홈으로
					</Button>
				</div>
			</StyledUnsubscribe>
		);
	}

	if (done || !data.subscribed) {
		return (
			<StyledUnsubscribe>
				<span className="badge done" aria-hidden>
					<LuMailCheck />
				</span>
				<p className="eyebrow">수신 거부</p>
				<h1 className="title">{done ? '구독을 해지했어요' : '이미 수신 거부된 메일이에요'}</h1>
				<p className="email">{data.email}</p>
				<p className="description">
					이 주소로 뉴스레터를 더 보내지 않아요. 다시 받고 싶으면 로그인해서 마이페이지에서 언제든 구독할 수 있어요.
				</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push('/articles')}>
						뉴스레터 둘러보기
					</Button>
					<Button scheme="outline" size="medium" onClick={() => router.push('/')}>
						홈으로
					</Button>
				</div>
			</StyledUnsubscribe>
		);
	}

	return (
		<StyledUnsubscribe>
			<span className="badge" aria-hidden>
				<LuMailX />
			</span>
			<p className="eyebrow">수신 거부</p>
			<h1 className="title">뉴픽 구독을 해지할까요?</h1>
			<p className="email">{data.email}</p>

			<div className="changes">
				<ul aria-label="해지하면 멈추는 것">
					{STOPS.map((item) => (
						<li key={item} className="stop">
							<LuX aria-hidden />
							{item}
						</li>
					))}
				</ul>
				<ul aria-label="그대로 남는 것">
					{KEEPS.map((item) => (
						<li key={item} className="keep">
							<LuCheck aria-hidden />
							{item}
						</li>
					))}
				</ul>
			</div>

			<div className="actions">
				<Button scheme="primary" size="medium" onClick={unsubscribe} disabled={pending}>
					{pending ? '해지하는 중…' : '해지하기'}
				</Button>
				<Button scheme="outline" size="medium" onClick={() => router.push('/')}>
					계속 받을게요
				</Button>
			</div>
			{failed && (
				<p role="alert" className="failed">
					{failed}
				</p>
			)}
		</StyledUnsubscribe>
	);
}

const pop = keyframes`
	0% { transform: scale(0.6); opacity: 0; }
	70% { transform: scale(1.08); opacity: 1; }
	100% { transform: none; }
`;

/** 오류 화면(ErrorState)과 같은 가운데 정렬: 아이콘 → 머리말 → 제목 → 메일 주소 → 설명 → 버튼 */
const StyledUnsubscribe = styled.section`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	width: 100%;
	max-width: 30rem;
	margin: 0 auto;
	padding: 6rem 0;
	text-align: center;
	word-break: keep-all;

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		padding: 4rem 0;
	}

	.badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		margin-bottom: 0.5rem;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: ${({ theme }) => theme.color.tertiary};
		color: ${({ theme }) => theme.color.primary};

		svg {
			width: 1.875rem;
			height: 1.875rem;
		}

		&.done {
			animation: ${pop} 0.5s ease both;
		}
	}

	.eyebrow {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.08em;
		color: ${({ theme }) => theme.color.subText};
	}

	.title {
		margin: 0;
		font-size: ${({ theme }) => theme.heading.extraSmall.fontSize};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.35;
		color: ${({ theme }) => theme.color.text};
	}

	/* 가린 메일 주소: 누구의 구독인지 */
	.email {
		margin: 0;
		padding: 0.25rem 0.875rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.surface};
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		font-variant-numeric: tabular-nums;
		color: ${({ theme }) => theme.color.text};
	}

	.description {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
	}

	/* 해지하면 멈추는 것(X) · 그대로 남는 것(체크) */
	.changes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: 100%;
		margin-top: 1rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		text-align: left;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
		}

		ul {
			display: flex;
			flex-direction: column;
			gap: 0.625rem;
			margin: 0;
			padding: 1.125rem 1.25rem;
			list-style: none;

			& + ul {
				border-left: 1px solid ${({ theme }) => theme.color.border};

				@media ${({ theme }) => theme.mediaQuery.mobile} {
					border-left: none;
					border-top: 1px solid ${({ theme }) => theme.color.border};
				}
			}
		}

		li {
			display: flex;
			align-items: flex-start;
			gap: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			line-height: 1.5;
			color: ${({ theme }) => theme.color.text};

			svg {
				flex-shrink: 0;
				width: 1rem;
				height: 1rem;
				margin-top: 0.125rem;
			}
		}

		.stop svg {
			color: ${({ theme }) => theme.color.error};
		}

		.keep svg {
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-direction: column;
			width: 100%;

			button {
				width: 100%;
			}
		}

		button {
			min-width: 10rem;
			justify-content: center;
		}
	}

	.failed {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
	}

	@media (prefers-reduced-motion: reduce) {
		.badge.done {
			animation: none;
		}
	}
`;

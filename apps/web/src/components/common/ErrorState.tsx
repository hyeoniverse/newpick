'use client';

import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import { LuBan, LuClock, LuFileX, LuLock, LuSearchX, LuServerCrash, LuTriangleAlert, LuWrench } from 'react-icons/lu';
import { ErrorAction, ErrorIcon, ErrorStateCopy } from '@/constants/errors';
import { useOpenLogin } from '@/hooks/useOpenLogin';

import styled from 'styled-components';
import Button from '@/components/common/Button';

const ICONS: Record<ErrorIcon, IconType> = {
	search: LuSearchX,
	lock: LuLock,
	ban: LuBan,
	clock: LuClock,
	server: LuServerCrash,
	tool: LuWrench,
	alert: LuTriangleAlert,
	deleted: LuFileX,
};

const ACTION_LABELS: Record<ErrorAction, string> = {
	home: '홈으로',
	retry: '다시 시도',
	login: '로그인',
	back: '이전 화면으로',
	articles: '뉴스레터 둘러보기',
};

interface Props extends ErrorStateCopy {
	/** 화면에 작게 보여 줄 상태 코드 */
	code?: number;
	/** '다시 시도'를 눌렀을 때. 없으면 새로 고침 */
	onRetry?: () => void;
	className?: string;
}

/**
 * 오류·빈 화면 공통. 아이콘 · 코드 · 제목 · 설명 · 다음에 할 일(주 버튼 + 홈으로)
 */
export default function ErrorState({ code, icon, title, description, action, onRetry, className }: Props) {
	const router = useRouter();
	const openLogin = useOpenLogin();
	const Icon = ICONS[icon];

	const runAction = () => {
		if (action === 'retry') return onRetry ? onRetry() : window.location.reload();
		if (action === 'login') return openLogin();
		if (action === 'back') return window.history.length > 1 ? router.back() : router.push('/');
		router.push(action === 'articles' ? '/articles' : '/');
	};

	return (
		<StyledErrorState className={className} role="alert">
			<span className="badge" aria-hidden>
				<Icon />
			</span>
			{code && <p className="code">{code}</p>}
			<h1 className="title">{title}</h1>
			<p className="description">{description}</p>

			<div className="actions">
				<Button scheme="primary" size="medium" onClick={runAction}>
					{ACTION_LABELS[action]}
				</Button>
				{action !== 'home' && (
					<Button scheme="outline" size="medium" onClick={() => router.push('/')}>
						홈으로
					</Button>
				)}
			</div>
		</StyledErrorState>
	);
}

const StyledErrorState = styled.section`
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
	}

	.code {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		font-variant-numeric: tabular-nums;
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

	.description {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
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
`;

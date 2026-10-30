'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { LuMonitor, LuSmartphone } from 'react-icons/lu';
import { fetchSessions, LoginSession, logoutOtherSessions, logoutSession } from '@/api/auth';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';
import { describeUserAgent } from '@/utils/userAgent';

const SESSIONS_KEY = ['login-sessions'];

/** '방금 전' · '3시간 전' · '2일 전' · 그보다 오래면 날짜 */
function ago(iso: string) {
	const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 60) return minutes < 1 ? '방금 전' : `${minutes}분 전`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}시간 전`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}일 전`;
	return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' }).format(
		new Date(iso)
	);
}

/**
 * 마이페이지 > 설정의 로그인한 기기: 브라우저 · OS · 마지막 활동, 기기마다 로그아웃 · 이 기기만 남기기.
 * 로그아웃시킨 기기는 지금 쓰던 짧은 토큰이 끝나는 대로(최대 30분) 로그인이 풀린다
 */
export default function LoginSessions() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const {
		data: sessions = [],
		isPending,
		isError,
	} = useQuery({ queryKey: SESSIONS_KEY, queryFn: fetchSessions });

	const refresh = () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
	const removeOne = useMutation({
		mutationFn: (session: LoginSession) => logoutSession(session.id),
		onSuccess: () => showToast('선택한 기기에서 로그아웃했습니다.', 'success'),
		onError: () => showToast('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});
	const removeOthers = useMutation({
		mutationFn: logoutOtherSessions,
		onSuccess: ({ removed }) => showToast(`다른 기기 ${removed}대에서 로그아웃했습니다.`, 'success'),
		onError: () => showToast('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error'),
		onSettled: refresh,
	});

	const others = sessions.filter((session) => !session.current).length;

	return (
		<StyledLoginSessions>
			<div className="head">
				<div>
					<Title size="extraSmall" weight="bold">
						로그인한 기기
					</Title>
					<Text size="small" color="subText">
						30일간 사용하지 않은 기기는 자동으로 로그아웃됩니다. 다른 기기를 로그아웃하면 30분 안에 적용됩니다.
					</Text>
				</div>
				{others > 0 && (
					<Button
						scheme="monoOutline"
						size="small"
						isLoading={removeOthers.isPending}
						onClick={() => removeOthers.mutate()}
					>
						다른 기기 모두 로그아웃
					</Button>
				)}
			</div>

			{/* 목록이 없을 때 빈 상자를 그리지 않는다 (빈 상자는 위 · 아래 테두리가 붙어 굵은 줄 하나로 보인다) */}
			{isPending ? (
				<p className="status">불러오는 중…</p>
			) : isError || sessions.length === 0 ? (
				<p className="status">로그인한 기기 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
			) : (
				<ul>
					{sessions.map((session) => {
						const { browser, os, mobile } = describeUserAgent(session.userAgent);
						const Icon = mobile ? LuSmartphone : LuMonitor;
						return (
							<li key={session.id}>
								<span className="icon" aria-hidden>
									<Icon />
								</span>
								<div className="info">
									<p className="name">
										{session.userAgent ? `${browser} · ${os}` : '기기 정보 없음 (이전 로그인)'}
										{session.current && <span className="here">이 기기</span>}
									</p>
									<p className="meta">
										{session.current ? '지금 사용 중' : `최근 활동 ${ago(session.lastUsedAt)}`} · 로그인{' '}
										{ago(session.createdAt)}
									</p>
								</div>
								{!session.current && (
									<Button
										scheme="outline"
										size="small"
										disabled={removeOne.isPending && removeOne.variables?.id === session.id}
										onClick={() => removeOne.mutate(session)}
									>
										로그아웃
									</Button>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</StyledLoginSessions>
	);
}

const StyledLoginSessions = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 4rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};
	word-break: keep-all;

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;

		> div {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	.status {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;

		& + li {
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	.icon {
		display: flex;
		flex-shrink: 0;
		color: ${({ theme }) => theme.color.subText};

		svg {
			width: 1.375rem;
			height: 1.375rem;
		}
	}

	.info {
		flex: 1;
		min-width: 0;

		p {
			margin: 0;
		}
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	}

	.here {
		padding: 0 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.tertiary};
		font-size: 0.75rem;
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.primary};
	}

	.meta {
		margin-top: 0.125rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}
`;

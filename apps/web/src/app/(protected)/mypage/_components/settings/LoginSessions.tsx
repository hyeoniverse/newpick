'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
		new Date(iso),
	);
}

/**
 * 마이페이지 > 설정의 로그인한 기기: 브라우저 · OS · 마지막 활동, 기기마다 로그아웃 · 이 기기만 남기기.
 * 로그아웃시킨 기기는 지금 쓰던 짧은 토큰이 끝나는 대로(최대 30분) 로그인이 풀린다
 */
export default function LoginSessions() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const { data: sessions = [], isPending, isError } = useQuery({ queryKey: SESSIONS_KEY, queryFn: fetchSessions });

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
		<section className="np-mypage-login-sessions-login-sessions">
			<div className="head">
				<div>
					<Title size="extraSmall" weight="bold">
						로그인한 기기
					</Title>
					<Text size="small" color="subText">
						30일간 사용하지 않은 기기는 자동으로 로그아웃됩니다. 다른 기기 로그아웃은 최대 30분 후 적용됩니다.
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
		</section>
	);
}

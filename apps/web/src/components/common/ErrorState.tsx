'use client';

import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
	LuBan,
	LuClock,
	LuFileWarning,
	LuFileX,
	LuLock,
	LuRefreshCw,
	LuScale,
	LuSearchX,
	LuServerCrash,
	LuTriangleAlert,
	LuWifiOff,
	LuWrench,
} from 'react-icons/lu';
import { ErrorAction, ErrorIcon, ErrorStateCopy } from '@/constants/errors';
import { useOpenLogin } from '@/hooks/useOpenLogin';

import { cx } from '@/styles/tw';
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
	file: LuFileWarning,
	refresh: LuRefreshCw,
	scale: LuScale,
	wifi: LuWifiOff,
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
	/**
	 * 화면 일부(탭 · 옆 칸) 안에 들어가는 작은 모양 (#17). 제목이 h2, 위아래 여백이 작고 '홈으로' 버튼이 없다.
	 * 기본은 페이지 전체를 차지하는 오류 화면
	 */
	inline?: boolean;
}

const TITLE = 'title m-0 font-bold leading-[1.35] text-text';

/**
 * 오류·빈 화면 공통. 아이콘 · 코드 · 제목 · 설명 · 다음에 할 일(주 버튼 + 홈으로)
 */
export default function ErrorState({ code, icon, title, description, action, onRetry, className, inline }: Props) {
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
		<section className={cx('np-error-state', inline && 'is-inline', className)} role="alert">
			<span
				className="badge mb-2 flex size-16 items-center justify-center rounded-full bg-tertiary text-primary [&_svg]:size-[1.875rem]"
				aria-hidden
			>
				<Icon />
			</span>
			{code && <p className="code m-0 text-small font-bold tracking-[0.08em] text-sub-text tabular-nums">{code}</p>}
			{inline ? (
				<h2 className={cx(TITLE, 'text-medium')}>{title}</h2>
			) : (
				<h1 className={cx(TITLE, 'text-heading-extra-small')}>{title}</h1>
			)}
			<p className="description m-0 text-small leading-[1.6] text-sub-text">{description}</p>

			{/* 단추는 10rem 이상, 휴대폰은 한 줄씩 꽉 채운다 (폭은 Button 변수로) */}
			<div
				className={cx(
					'actions flex gap-3 [&_button]:min-w-40 mobile:w-full mobile:flex-col mobile:[&_button]:[--btn-width:100%]',
					inline ? 'mt-4' : 'mt-6',
				)}
			>
				<Button scheme="primary" size="medium" onClick={runAction}>
					{ACTION_LABELS[action]}
				</Button>
				{action !== 'home' && !inline && (
					<Button scheme="outline" size="medium" onClick={() => router.push('/')}>
						홈으로
					</Button>
				)}
			</div>
		</section>
	);
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { linkGoogleAccount, sendEmailCode, verifyEmailCode } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

type Step = { kind: 'idle' } | { kind: 'enter' } | { kind: 'code'; email: string; resendAfter: number };

/** API 오류 message는 사용자에게 그대로 보여 줘도 되는 글 (남은 횟수가 있으면 덧붙인다) */
const errorText = (error: unknown) => {
	if (!(error instanceof ApiError)) return '잠시 뒤 다시 시도해 주세요.';
	const left = (error.body as { details?: { attemptsLeft?: number } } | undefined)?.details?.attemptsLeft;
	return left ? `${error.message} (${left}번 남음)` : error.message;
};

/** 다른 Google 계정으로 바꾸고 돌아왔을 때(?google=…) 안내 */
const LINK_RESULTS: Record<string, [string, 'success' | 'error' | 'info']> = {
	linked: ['다른 Google 계정으로 바꿨습니다. 이제 그 계정으로 로그인하고, 뉴스레터도 그 주소로 갑니다.', 'success'],
	same: ['지금 연결된 Google 계정과 같습니다.', 'info'],
	taken: ['그 Google 계정(또는 주소)은 이미 다른 뉴픽 계정에 연결되어 있어 바꾸지 않았습니다.', 'error'],
	failed: ['Google 계정을 바꾸지 못했습니다. 다시 시도해 주세요.', 'error'],
};

/**
 * 마이페이지 > 설정의 이메일 (로그인 · 뉴스레터 받는 주소). 두 가지로 바꾼다
 * - Google 계정 바꾸기: 구글 계정 고르기 → 로그인 연결과 이메일이 함께 그 계정으로 (주소는 Google이 확인한 것)
 * - 받는 주소만 바꾸기: 새 주소 → 그 주소로 온 6자리 코드. 로그인은 그대로 같은 Google 계정으로
 */
export default function AccountEmail() {
	const { user, refetchUser } = useAuth();
	const { showToast } = useToast();
	const [step, setStep] = useState<Step>({ kind: 'idle' });
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const [now, setNow] = useState(() => Date.now());

	// 다른 Google 계정으로 바꾸고 돌아오면 결과를 알리고 주소창의 ?google=…은 지운다
	useEffect(() => {
		const url = new URL(window.location.href);
		const result = LINK_RESULTS[url.searchParams.get('google') ?? ''];
		if (!result) return;
		showToast(...result);
		refetchUser();
		url.searchParams.delete('google');
		window.history.replaceState(null, '', url);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- 돌아온 첫 화면에서 한 번만
	}, []);

	const onLinkGoogle = async () => {
		setBusy(true);
		try {
			await linkGoogleAccount();
		} catch {
			showToast('잠시 뒤 다시 시도해 주세요.', 'error');
			setBusy(false);
		}
	};

	// 다시 보내기까지 남은 초를 세기 위해 코드 단계에서만 1초마다
	useEffect(() => {
		if (step.kind !== 'code') return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [step.kind]);

	const reset = () => {
		setStep({ kind: 'idle' });
		setEmail('');
		setCode('');
		setError('');
	};

	const send = async (to: string) => {
		setBusy(true);
		setError('');
		try {
			const sent = await sendEmailCode(to);
			setStep({ kind: 'code', email: sent.email, resendAfter: new Date(sent.resendAfter).getTime() });
			setNow(Date.now());
			setCode('');
		} catch (e) {
			setError(errorText(e));
		} finally {
			setBusy(false);
		}
	};

	const onSend = (event: FormEvent) => {
		event.preventDefault();
		send(email);
	};

	const onVerify = async (event: FormEvent) => {
		event.preventDefault();
		setBusy(true);
		setError('');
		try {
			const changed = await verifyEmailCode(code);
			await refetchUser();
			reset();
			showToast(`이메일을 ${changed.email}(으)로 바꿨습니다.`, 'success');
		} catch (e) {
			setError(errorText(e));
			// 코드가 만료됐거나 다 틀렸으면 새 주소부터 다시
			if (e instanceof ApiError && e.code === 'EMAIL_CODE_EXPIRED') setStep({ kind: 'enter' });
		} finally {
			setBusy(false);
		}
	};

	const waitSeconds = step.kind === 'code' ? Math.max(0, Math.ceil((step.resendAfter - now) / 1000)) : 0;

	return (
		<StyledAccountEmail>
			<div className="head">
				<div>
					<Title size="extraSmall" weight="bold">
						이메일
					</Title>
					<Text size="small" color="subText">
						로그인한 Google 계정과 뉴스레터를 받는 주소입니다. Google 계정을 바꾸면 로그인과 주소가 함께 바뀌고, 받는
						주소만 바꾸면 로그인은 지금 Google 계정 그대로입니다.
					</Text>
				</div>
				{step.kind === 'idle' && (
					<div className="actions">
						<Button scheme="monoOutline" size="small" isLoading={busy} onClick={onLinkGoogle}>
							Google 계정 바꾸기
						</Button>
						<Button scheme="monoOutline" size="small" onClick={() => setStep({ kind: 'enter' })}>
							받는 주소만 바꾸기
						</Button>
					</div>
				)}
			</div>

			<p className="current">{user?.email}</p>

			{step.kind === 'enter' && (
				<form className="form" onSubmit={onSend}>
					<label htmlFor="new-email">뉴스레터를 받을 새 주소</label>
					<div className="row">
						<input
							id="new-email"
							type="email"
							inputMode="email"
							autoComplete="email"
							required
							maxLength={191}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="name@example.com"
							autoFocus
						/>
						<Button type="submit" scheme="primary" size="small" isLoading={busy} disabled={!email}>
							인증 코드 받기
						</Button>
						<Button type="button" scheme="outline" size="small" onClick={reset}>
							취소
						</Button>
					</div>
				</form>
			)}

			{step.kind === 'code' && (
				<form className="form" onSubmit={onVerify}>
					<label htmlFor="email-code">
						<b>{step.email}</b>(으)로 보낸 6자리 코드 (10분 동안)
					</label>
					<div className="row">
						<input
							id="email-code"
							className="code"
							inputMode="numeric"
							autoComplete="one-time-code"
							pattern="\d{6}"
							maxLength={6}
							required
							value={code}
							onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
							placeholder="000000"
							autoFocus
						/>
						<Button type="submit" scheme="primary" size="small" isLoading={busy} disabled={code.length !== 6}>
							확인
						</Button>
						<Button
							type="button"
							scheme="outline"
							size="small"
							disabled={busy || waitSeconds > 0}
							onClick={() => send(step.email)}
						>
							{waitSeconds > 0 ? `다시 보내기 (${waitSeconds}초)` : '다시 보내기'}
						</Button>
						<Button type="button" scheme="outline" size="small" onClick={reset}>
							취소
						</Button>
					</div>
				</form>
			)}

			{error && (
				<p className="error" role="alert">
					{error}
				</p>
			)}
		</StyledAccountEmail>
	);
}

const StyledAccountEmail = styled.section`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin-top: 4rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};
	word-break: keep-all;

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;

		> div:first-child {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		.actions {
			display: flex;
			flex-shrink: 0;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	.current {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		overflow-wrap: anywhere;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		label {
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.subText};
			overflow-wrap: anywhere;

			b {
				color: ${({ theme }) => theme.color.text};
			}
		}
	}

	/* 입력칸과 버튼은 같은 높이 (좁은 화면에서 버튼이 다음 줄로 내려가도) */
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;

		> input,
		> button {
			height: 2.5rem;
		}
	}

	input {
		flex: 1 1 16rem;
		min-width: 0;
		padding: 0 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.text};

		&:focus-visible {
			outline: none;
			border-color: ${({ theme }) => theme.color.primary};
		}

		/* 6자리가 다 보이게: 글자 폭(1ch) × 6 + 간격 + 안쪽 여백 + 테두리 */
		&.code {
			flex: 0 0 auto;
			width: calc(6ch + 5 * 0.25em + 1.5rem + 2px);
			font-size: ${({ theme }) => theme.fontSize.large};
			font-variant-numeric: tabular-nums;
			letter-spacing: 0.25em;
		}
	}

	.error {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
	}
`;

'use client';

import { FormEvent, useEffect, useState } from 'react';
import styled from 'styled-components';
import { sendEmailCode, verifyEmailCode } from '@/api/auth';
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

/**
 * 마이페이지 > 설정의 이메일 (로그인 · 뉴스레터 받는 주소).
 * 바꾸기 → 새 주소 → 그 주소로 온 6자리 코드를 넣으면 바뀐다. 로그인은 그대로 같은 Google 계정으로
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
						로그인 계정과 뉴스레터를 받는 주소입니다. 바꿔도 같은 Google 계정으로 로그인합니다.
					</Text>
				</div>
				{step.kind === 'idle' && (
					<Button scheme="monoOutline" size="small" onClick={() => setStep({ kind: 'enter' })}>
						바꾸기
					</Button>
				)}
			</div>

			<p className="current">{user?.email}</p>

			{step.kind === 'enter' && (
				<form className="form" onSubmit={onSend}>
					<label htmlFor="new-email">새 이메일</label>
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

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	input {
		flex: 1 1 16rem;
		min-width: 0;
		height: 2.5rem;
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

		/* 6자리가 다 보이게: 글자 폭(1ch) × 6 + 간격 + 안쪽 여백 */
		&.code {
			flex: 0 0 auto;
			width: calc(6ch + 5 * 0.25em + 1.5rem + 2px);
			box-sizing: content-box;
			padding: 0 0.75rem;
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

'use client';

import { AnimationEvent, FormEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { linkGoogleAccount, sendEmailCode, verifyEmailCode } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';
import CodeInput from './CodeInput';

type Step =
	| { kind: 'idle' }
	| { kind: 'enter' }
	| { kind: 'code'; email: string; resendAfter: number; expiresAt: number };

/** 남은 시간 '9:41' */
const clock = (ms: number) => {
	const seconds = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** API 오류 message는 사용자에게 그대로 보여 줘도 되는 글 (남은 횟수가 있으면 덧붙인다) */
const errorText = (error: unknown) => {
	if (!(error instanceof ApiError)) return '잠시 후 다시 시도해 주세요.';
	const left = (error.body as { details?: { attemptsLeft?: number } } | undefined)?.details?.attemptsLeft;
	return left ? `${error.message} (${left}번 남음)` : error.message;
};

/** 다른 Google 계정으로 바꾸고 돌아왔을 때(?google=…) 안내 */
const LINK_RESULTS: Record<string, [string, 'success' | 'error' | 'info']> = {
	linked: ['Google 계정을 변경했습니다. 로그인 계정과 수신 이메일이 함께 변경되었습니다.', 'success'],
	same: ['현재 연결된 Google 계정과 같습니다.', 'info'],
	taken: ['다른 뉴픽 계정에 연결된 Google 계정(또는 이메일)이라 변경하지 않았습니다.', 'error'],
	failed: ['Google 계정을 변경하지 못했습니다. 다시 시도해 주세요.', 'error'],
};

/**
 * 마이페이지 > 설정의 이메일 (로그인 · 뉴스레터 받는 주소). 두 가지로 바꾼다
 * - Google 계정 변경: 구글 계정 고르기 → 로그인 연결과 이메일이 함께 그 계정으로 (주소는 Google이 확인한 것)
 * - 수신 이메일 변경: 새 주소 → 그 주소로 온 6자리 코드. 로그인은 그대로 같은 Google 계정으로
 */
export default function AccountEmail() {
	const { user, refetchUser } = useAuth();
	const { showToast } = useToast();
	const [step, setStep] = useState<Step>({ kind: 'idle' });
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [error, setError] = useState('');
	// 틀린 코드였는지 (칸을 빨갛게, 다시 입력하면 원래대로)
	const [invalid, setInvalid] = useState(false);
	const codeForm = useRef<HTMLFormElement>(null);
	const [busy, setBusy] = useState(false);
	const [now, setNow] = useState(() => Date.now());
	// 닫히는 중: 접히는 애니메이션이 끝난 뒤에 폼을 치운다
	const [closing, setClosing] = useState(false);

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
			showToast('잠시 후 다시 시도해 주세요.', 'error');
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
		setClosing(false);
		setStep({ kind: 'idle' });
		setEmail('');
		setCode('');
		setError('');
		setInvalid(false);
	};

	/** 폼 닫기: 접히며 사라진 뒤 reset (움직임 줄이기 설정이면 애니메이션이 없어 바로) */
	const close = () => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) reset();
		else setClosing(true);
	};

	const revealProps = {
		className: closing ? 'reveal closing' : 'reveal',
		onAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => {
			if (closing && event.target === event.currentTarget) reset();
		},
	};

	const send = async (to: string) => {
		setBusy(true);
		setError('');
		try {
			const sent = await sendEmailCode(to);
			setStep({
				kind: 'code',
				email: sent.email,
				resendAfter: new Date(sent.resendAfter).getTime(),
				expiresAt: new Date(sent.expiresAt).getTime(),
			});
			setInvalid(false);
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
			close();
			showToast(`수신 이메일을 ${changed.email}(으)로 변경했습니다.`, 'success');
		} catch (e) {
			setError(errorText(e));
			setInvalid(e instanceof ApiError && e.code === 'EMAIL_CODE_INVALID');
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
						Google 계정 변경 시 로그인 계정과 수신 이메일이 함께 변경됩니다. 수신 이메일 변경 시 로그인 계정은
						유지됩니다.
					</Text>
				</div>
			</div>

			<div className="current-row">
				<p className="current">{user?.email}</p>
				{step.kind === 'idle' && (
					<div className="actions">
						<Button scheme="monoOutline" size="small" isLoading={busy} onClick={onLinkGoogle}>
							Google 계정 변경
						</Button>
						<Button scheme="monoOutline" size="small" onClick={() => setStep({ kind: 'enter' })}>
							수신 이메일 변경
						</Button>
					</div>
				)}
			</div>

			{step.kind === 'enter' && (
				<div {...revealProps}>
				<form className="form" onSubmit={onSend}>
					<label htmlFor="new-email">새 수신 이메일</label>
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
							인증 코드 요청
						</Button>
						<Button type="button" scheme="outline" size="small" onClick={close}>
							취소
						</Button>
					</div>
				</form>
				</div>
			)}

			{step.kind === 'code' && (
				<div {...revealProps}>
					<form ref={codeForm} className="form" onSubmit={onVerify}>
						<label htmlFor="email-code">
							<b>{step.email}</b>(으)로 보낸 인증 코드 6자리를 입력해 주세요.
						</label>
						<CodeInput
							id="email-code"
							value={code}
							invalid={invalid}
							autoFocus
							onChange={(value) => {
								setCode(value);
								setInvalid(false);
								// 6자리를 다 넣으면 바로 확인
								if (value.length === 6 && !busy) setTimeout(() => codeForm.current?.requestSubmit());
							}}
						/>
						<p className="code-meta">
							{step.expiresAt > now ? (
								<>
									남은 시간 <span className="clock">{clock(step.expiresAt - now)}</span>
								</>
							) : (
								'인증 코드가 만료되었습니다. 재전송해 주세요.'
							)}
							<button
								type="button"
								className="resend"
								disabled={busy || waitSeconds > 0}
								onClick={() => send(step.email)}
							>
								{waitSeconds > 0 ? `재전송 (${waitSeconds}초)` : '재전송'}
							</button>
						</p>
						<div className="row">
							<Button type="submit" scheme="primary" size="small" isLoading={busy} disabled={code.length !== 6}>
								확인
							</Button>
							<Button type="button" scheme="outline" size="small" onClick={close}>
								취소
							</Button>
						</div>
					</form>
				</div>
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

	.head > div {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.current {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		overflow-wrap: anywhere;
	}

	/* 현재 이메일 + 오른쪽 끝 변경 버튼 (좁으면 버튼이 다음 줄로) */
	.current-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
	}

	/* 폼이 닫힌 뒤 다시 나타날 때 튀지 않게 */
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		animation: email-actions-in 0.2s ease-out;
	}

	/* 입력 폼(새 수신 이메일 · 인증 코드)이 열릴 때: 실제 높이만큼 펼쳐지며(아래 내용도 같이 밀려남) 위에서 내려오고 선명해진다 */
	.reveal {
		display: grid;
		grid-template-rows: 1fr;
		/* 펼쳐지는 동안 칸 밖으로 넘친 부분은 가린다 */
		overflow: hidden;
		animation: email-form-in 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);

		> .form {
			min-height: 0;
		}

		/* 닫힐 때: 반대로 접히며 흐려진다 */
		&.closing {
			animation: email-form-out 0.25s cubic-bezier(0.4, 0, 0.6, 1) forwards;
		}
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

	/* 새 수신 이메일 입력 (인증 코드는 CodeInput이 따로 그린다) */
	.row > input {
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
	}

	@keyframes email-form-in {
		from {
			grid-template-rows: 0fr;
			opacity: 0;
			transform: translateY(-0.75rem);
		}
		to {
			grid-template-rows: 1fr;
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes email-form-out {
		from {
			grid-template-rows: 1fr;
			opacity: 1;
			transform: translateY(0);
		}
		to {
			grid-template-rows: 0fr;
			opacity: 0;
			transform: translateY(-0.5rem);
		}
	}

	@keyframes email-actions-in {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal,
		.reveal.closing,
		.actions {
			animation: none;
		}
	}

	/* 남은 시간 · 재전송 */
	.code-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};

		.clock {
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}
	}

	.resend {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: ${({ theme }) => theme.color.text};
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;

		&:disabled {
			color: ${({ theme }) => theme.color.subText};
			text-decoration: none;
			cursor: default;
		}
	}

	.error {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
	}
`;

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { apiFetch, ApiError } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import styles from '@/app/(protected)/protected.module.css';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/loader/Spinner';

type Target = { email: string; subscribed: boolean };

/**
 * 수신 거부 확인 화면 (#18). 링크를 여는 것만으로는 해지하지 않고(메일 보안 검사기가 미리 열어 봄),
 * '해지하기'를 눌러야 해지한다. 마이페이지와 같은 틀
 */
export default function Unsubscribe() {
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
			<div className={styles.page}>
				<StyledBox>
					<Spinner />
				</StyledBox>
			</div>
		);
	}

	if (!token || error || !data) {
		return (
			<Frame
				title="수신 거부 링크가 올바르지 않아요"
				text={'메일 아래쪽의 "수신 거부"를 다시 눌러 주세요. 로그인했다면 마이페이지에서도 해지할 수 있어요.'}
			>
				<Link href="/mypage?tab=settings">
					<Button scheme="monoOutline" size="small">
						마이페이지에서 해지하기
					</Button>
				</Link>
			</Frame>
		);
	}

	if (done || !data.subscribed) {
		return (
			<Frame
				title={done ? '구독을 해지했어요' : '이미 수신 거부된 메일이에요'}
				text={`${data.email}(으)로 뉴픽 뉴스레터를 더 보내지 않아요. 다시 받고 싶으면 로그인해서 마이페이지에서 언제든 구독할 수 있어요.`}
			>
				<Link href="/">
					<Button scheme="monoOutline" size="small">
						뉴픽 홈으로
					</Button>
				</Link>
			</Frame>
		);
	}

	return (
		<Frame
			title="뉴픽 구독을 해지할까요?"
			text={`${data.email}(으)로 보내던 아침 뉴스레터를 더 보내지 않아요. 고른 관심사도 함께 지워지고, 북마크는 그대로 남아요.`}
		>
			<div className="buttons">
				<Button scheme="primary" size="small" onClick={unsubscribe} disabled={pending}>
					{pending ? '해지하는 중…' : '해지하기'}
				</Button>
				<Link href="/">
					<Button scheme="monoOutline" size="small">
						계속 받을게요
					</Button>
				</Link>
			</div>
			{failed && (
				<p role="alert" className="failed">
					{failed}
				</p>
			)}
		</Frame>
	);
}

/** 마이페이지 '회원 탈퇴' 줄과 같은 모양: 제목 한 줄 아래 구분선, 굵은 제목 · 회색 설명 · 작은 버튼 */
function Frame({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
	return (
		<div className={styles.page}>
			<Title size="extraSmall">수신 거부</Title>
			<StyledBox>
				<div className="copy">
					<Title size="extraSmall" weight="bold">
						{title}
					</Title>
					<Text size="small" color="subText">
						{text}
					</Text>
				</div>
				{children}
			</StyledBox>
		</div>
	);
}

const StyledBox = styled.section`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 1.25rem;
	margin-top: 2.5rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};

	.copy {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-width: 40rem;
		word-break: keep-all;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
	}

	.failed {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.error};
	}
`;

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
			<section className="np-unsubscribe-unsubscribe-unsubscribe">
				<Spinner />
			</section>
		);
	}

	if (!token || error || !data) {
		return (
			<section className="np-unsubscribe-unsubscribe-unsubscribe">
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
			</section>
		);
	}

	if (done || !data.subscribed) {
		return (
			<section className="np-unsubscribe-unsubscribe-unsubscribe">
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
			</section>
		);
	}

	return (
		<section className="np-unsubscribe-unsubscribe-unsubscribe">
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
		</section>
	);
}

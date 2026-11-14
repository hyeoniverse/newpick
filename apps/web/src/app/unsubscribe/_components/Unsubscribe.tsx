'use client';

import { UNSUBSCRIBE } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { queryKeys } from '@/api/queryKeys';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuMailX, LuMailCheck, LuLink2Off, LuX, LuCheck } from 'react-icons/lu';
import { errorMessage } from '@/api/client';
import { fetchUnsubscribeTarget, unsubscribeByToken } from '@/api/subscription';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/loader/Spinner';

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
		queryKey: queryKeys.unsubscribe(token),
		queryFn: () => fetchUnsubscribeTarget(token),
		enabled: Boolean(token),
		retry: false,
	});

	const unsubscribe = async () => {
		setPending(true);
		setFailed(null);
		try {
			await unsubscribeByToken(token);
			setDone(true);
		} catch (e) {
			setFailed(errorMessage(e, UNSUBSCRIBE.failed));
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
				<h1 className="title">{UNSUBSCRIBE.invalid.title}</h1>
				<p className="description">{UNSUBSCRIBE.invalid.body}</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push(ROUTES.mypage('settings'))}>
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
				<h1 className="title">{done ? UNSUBSCRIBE.done : UNSUBSCRIBE.already}</h1>
				<p className="email">{data.email}</p>
				<p className="description">{UNSUBSCRIBE.doneBody}</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push(ROUTES.articles)}>
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
			<h1 className="title">{UNSUBSCRIBE.confirm}</h1>
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
					{UNSUBSCRIBE.keep}
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

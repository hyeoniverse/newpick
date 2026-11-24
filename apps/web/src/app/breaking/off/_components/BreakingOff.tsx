'use client';

import { BREAKING } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { queryKeys } from '@/api/queryKeys';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LuBellOff, LuBellRing, LuLink2Off, LuX, LuCheck } from 'react-icons/lu';
import { errorMessage } from '@/api/client';
import { fetchBreakingOffTarget, turnOffBreakingByToken } from '@/api/subscription';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/loader/Spinner';

const COPY = BREAKING.off;

/**
 * '속보만 받지 않기' 화면. 수신 거부 화면(unsubscribe)과 같은 구성 · 모양.
 * 링크를 여는 것만으로는 끄지 않고(메일 보안 검사기가 미리 열어 봄) '받지 않기'를 눌러야 끈다
 */
export default function BreakingOff() {
	const router = useRouter();
	const token = useSearchParams().get('token') ?? '';
	const [done, setDone] = useState(false);
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState<string | null>(null);

	const { data, error, isLoading } = useQuery({
		queryKey: queryKeys.breakingOff(token),
		queryFn: () => fetchBreakingOffTarget(token),
		enabled: Boolean(token),
		retry: false,
	});

	const turnOff = async () => {
		setPending(true);
		setFailed(null);
		try {
			await turnOffBreakingByToken(token);
			setDone(true);
		} catch (e) {
			setFailed(errorMessage(e, COPY.failed));
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
				<p className="eyebrow">{COPY.eyebrow}</p>
				<h1 className="title">{COPY.invalid.title}</h1>
				<p className="description">{COPY.invalid.body}</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push(ROUTES.mypage('settings'))}>
						마이페이지에서 바꾸기
					</Button>
					<Button scheme="outline" size="medium" onClick={() => router.push(ROUTES.home)}>
						홈으로
					</Button>
				</div>
			</section>
		);
	}

	if (done || !data.receiving) {
		return (
			<section className="np-unsubscribe-unsubscribe-unsubscribe">
				<span className="badge done" aria-hidden>
					<LuBellOff />
				</span>
				<p className="eyebrow">{COPY.eyebrow}</p>
				<h1 className="title">{done ? COPY.done : COPY.already}</h1>
				<p className="email">{data.email}</p>
				<p className="description">{COPY.doneBody}</p>
				<div className="actions">
					<Button scheme="primary" size="medium" onClick={() => router.push(ROUTES.breakingArchive)}>
						지난 속보 보기
					</Button>
					<Button scheme="outline" size="medium" onClick={() => router.push(ROUTES.home)}>
						홈으로
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section className="np-unsubscribe-unsubscribe-unsubscribe">
			<span className="badge" aria-hidden>
				<LuBellRing />
			</span>
			<p className="eyebrow">{COPY.eyebrow}</p>
			<h1 className="title">{COPY.confirm}</h1>
			<p className="email">{data.email}</p>

			<div className="changes">
				<ul aria-label="받지 않게 되는 것">
					{COPY.stops.map((item) => (
						<li key={item} className="stop">
							<LuX aria-hidden />
							{item}
						</li>
					))}
				</ul>
				<ul aria-label="그대로 받는 것">
					{COPY.keeps.map((item) => (
						<li key={item} className="keep">
							<LuCheck aria-hidden />
							{item}
						</li>
					))}
				</ul>
			</div>

			<div className="actions">
				<Button scheme="primary" size="medium" onClick={turnOff} disabled={pending}>
					{pending ? '바꾸는 중…' : '받지 않기'}
				</Button>
				<Button scheme="outline" size="medium" onClick={() => router.push(ROUTES.home)}>
					{COPY.keep}
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

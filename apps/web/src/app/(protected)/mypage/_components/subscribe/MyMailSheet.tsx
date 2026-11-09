'use client';

import { queryKeys } from '@/api/queryKeys';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import MailView from '@/components/common/MailView';
import Skeleton from '@/components/common/loader/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { errorStateFor, statusOf } from '@/constants/errors';

/** 내 뉴스레터에서 메일 한 통을 연 시트: 받은 그대로의 메일 (체험하기와 같은 모양) */
export default function MyMailSheet({ sentAt }: { sentAt: string }) {
	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: queryKeys.mails.one(sentAt),
		queryFn: () => apiFetch<{ subject: string; html: string }>(API_ENDPOINTS.MY.MAIL(sentAt)),
		staleTime: Infinity,
	});

	return (
		<div className="np-mypage-my-mail-sheet-sheet" aria-busy={isPending}>
			{isPending ? (
				// 불러오는 동안의 자리 표시는 시트 높이 안에만 (넘치면 시트가 단추 너머로 스크롤됐다)
				<div className="loading" aria-hidden>
					<Skeleton />
				</div>
			) : isError ? (
				<ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />
			) : (
				<MailView subject={data.subject} html={data.html} title="받은 메일" />
			)}
		</div>
	);
}

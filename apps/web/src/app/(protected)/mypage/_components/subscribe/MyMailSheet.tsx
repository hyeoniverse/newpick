'use client';

import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import MailView from '@/components/common/MailView';
import Skeleton from '@/components/common/loader/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { errorStateFor, statusOf } from '@/constants/errors';

/** 내 뉴스레터에서 메일 한 통을 연 시트: 받은 그대로의 메일 (체험하기와 같은 모양) */
export default function MyMailSheet({ sentAt }: { sentAt: string }) {
	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: ['myMail', sentAt],
		queryFn: () => apiFetch<{ subject: string; html: string }>(API_ENDPOINTS.MY.MAIL(sentAt)),
		staleTime: Infinity,
	});

	return (
		<StyledSheet aria-busy={isPending}>
			{isPending ? (
				<Skeleton />
			) : isError ? (
				<ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />
			) : (
				<MailView subject={data.subject} html={data.html} title="받은 메일" />
			)}
		</StyledSheet>
	);
}

/** 체험하기 시트와 같은 높이 (넓은 시트 안을 채운다) */
const StyledSheet = styled.div`
	width: 100%;
	height: min(46rem, calc(85vh - 4rem));
	display: flex;
	flex-direction: column;
`;

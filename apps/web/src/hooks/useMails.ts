import { COMMON } from '@/copy';
import { queryKeys } from '@/api/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyMails, MAIL_PAGE_SIZE, markMail } from '@/api/mails';
import { useToast } from '@/hooks/useToast';
import { useBidirectionalPages } from '@/hooks/useBidirectionalPages';
import { useSignedInUser } from '@/components/common/auth/InitialProfile';

export { MAIL_PAGE_SIZE };

/**
 * 마이페이지 받은 메일 (#230): 묶음 단위로 받아 아래로 이어 붙이고, 달로 건너뛰면 위로는 앞 묶음.
 * filters: 'starred=true&folder=3' 같은 쿼리. startOffset: 고른 달의 첫 메일 순번
 */
export function useMailPages(filters: string, startOffset = 0) {
	// 서버가 받아 둔 프로필로도: 첫 쪽을 서버가 미리 받아 두면(마이페이지 page) 브라우저가 프로필을 받기 전에 그린다
	const user = useSignedInUser();
	return useBidirectionalPages({
		queryKey: queryKeys.mails.page(user?.id, filters, startOffset),
		fetchPage: (offset, limit) => fetchMyMails(offset, limit, filters),
		pageSize: MAIL_PAGE_SIZE,
		startOffset,
		enabled: !!user,
	});
}

/** 받은 메일 한 통 표시 (중요 · 폴더). 목록 · 폴더 개수를 다시 받는다 */
export function useMarkMail() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	return useMutation({
		mutationFn: (body: { sentAt: string; starred?: boolean; folderId?: number | null }) => markMail(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.mails.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
		},
		onError: () => showToast(COMMON.changeFailedRetry, 'error'),
	});
}

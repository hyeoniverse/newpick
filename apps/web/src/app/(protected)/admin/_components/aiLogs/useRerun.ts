'use client';

import { ADMIN, COMMON } from '@/copy';
import type { AiLogRow } from '@newpick/shared';
import { useQueryClient } from '@tanstack/react-query';
import { rerunSummary } from '@/api/admin';
import { queryKeys } from '@/api/queryKeys';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { kstDateOf } from '@/utils/formatter';

/** 실패한 요약을 그날 · 그 분야로 다시 만든다 (서버가 그날 이미 있는 분야는 건너뛴다) */
export function useRerun() {
	const confirm = useConfirmAction();
	const queryClient = useQueryClient();
	return (log: AiLogRow) => {
		const date = kstDateOf(log.createdAt);
		confirm({
			title: ADMIN.aiLogs.rerunTitle(date, log.category ?? ''),
			content: ADMIN.aiLogs.rerunBody,
			confirmLabel: '다시 생성',
			run: () => rerunSummary({ date, categoryId: log.categoryId }),
			success: ADMIN.aiLogs.rerunStarted(date, log.category ?? ''),
			failure: COMMON.startFailed,
			onDone: () => setTimeout(() => queryClient.invalidateQueries({ queryKey: queryKeys.admin.aiLogs.all }), 60_000),
		});
	};
}

'use client';

import { ADMIN, COMMON } from '@/copy';
import type { JobName, Schedule } from '@newpick/shared';
import { rerunSummary, runJobNow, toggleJob } from '@/api/admin';
import { errorMessage } from '@/api/client';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { kstDate } from '@/utils/formatter';
import ScheduleEditor from '../ScheduleEditor';
import { JOB_LABEL, JOB_WARNING } from '../../_lib/jobs';
import FillDay from './FillDay';
import MissingCategories from './MissingCategories';

/**
 * 예약 작업 조작 (#198): 켜기 · 끄기, 지금 실행(확인 창 + AI 요약이면 만들 분야), 빠진 날 채우기 창, 예약 시간 고치기 창.
 * 끝나면 refresh로 대시보드를 새로 받는다 (실행은 서버가 기록을 남길 틈을 주고)
 */
export function useJobActions(schedule: Schedule | undefined, refresh: () => void) {
	const { showToast } = useToast();
	const { openModal, closeModal } = useModal();
	const confirm = useConfirmAction();
	const refreshSoon = () => setTimeout(refresh, 800);

	return {
		editSchedule: () =>
			schedule &&
			openModal(
				<ScheduleEditor
					initial={schedule}
					onCancel={closeModal}
					onSaved={() => {
						closeModal();
						showToast(ADMIN.jobs.scheduleSaved, 'success');
						refresh();
					}}
				/>,
			),

		toggle: async (job: JobName, enable: boolean) => {
			try {
				await toggleJob(job, enable);
				showToast(enable ? ADMIN.jobs.enabled(JOB_LABEL[job]) : ADMIN.jobs.disabled(JOB_LABEL[job]), 'info');
				refresh();
			} catch (error) {
				showToast(errorMessage(error, COMMON.changeFailed), 'error');
			}
		},

		// 빠진 날 채우기: 고른 날에 뉴스레터가 없는 관심사만 그날 기사 · 그날 날짜로 (서버가 있는 관심사는 건너뛴다)
		fillDay: () =>
			openModal(
				<FillDay
					onCancel={closeModal}
					onConfirm={async (date) => {
						closeModal();
						try {
							await rerunSummary({ date });
							showToast(ADMIN.jobs.fillStarted(date), 'success');
							refreshSoon();
						} catch (error) {
							showToast(errorMessage(error, COMMON.startFailed), 'error');
						}
					}}
				/>,
			),

		runNow: (job: JobName) =>
			confirm({
				title: ADMIN.jobs.runTitle(JOB_LABEL[job]),
				content: JOB_WARNING[job],
				confirmLabel: '지금 실행',
				// AI 요약은 오늘 아직 없는 분야만 만들므로, 어느 분야를 만드는지 보여 준다
				children: job === 'summary' && <MissingCategories date={kstDate(0)} label="재생성 항목" />,
				run: () => runJobNow(job),
				success: ADMIN.jobs.runStarted(JOB_LABEL[job]),
				failure: COMMON.startFailed,
				onDone: refreshSoon,
			}),
	};
}

export type JobActions = ReturnType<typeof useJobActions>;

import * as Sentry from '@sentry/nestjs';
import { JobRunsService } from './job-runs.service';

jest.mock('@sentry/nestjs', () => ({ captureMessage: jest.fn() }));

const prisma = {
	jobRun: { create: jest.fn().mockResolvedValue({ id: 1 }), update: jest.fn().mockResolvedValue({}) },
};

describe('예약 작업 실패를 Sentry로 (#341)', () => {
	it('실패 · 일부 실패는 보내고, 성공 · 건너뜀은 보내지 않는다', () => {
		const runs = new JobRunsService(prisma as never);
		runs.finishRun('mail', 'failed', 'SMTP down');
		runs.finishRun('summary', 'partial', '실패: IT');
		runs.finishRun('crawling', 'success', '기사 3건');
		runs.finishRun('mail', 'skipped', '구독자 없음');

		expect(jest.mocked(Sentry.captureMessage).mock.calls).toEqual([
			['예약 작업 mail failed: SMTP down', { level: 'error', tags: { job: 'mail' } }],
			['예약 작업 summary partial: 실패: IT', { level: 'warning', tags: { job: 'summary' } }],
		]);
	});
});

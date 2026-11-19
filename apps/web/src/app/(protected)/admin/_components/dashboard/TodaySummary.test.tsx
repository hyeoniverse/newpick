import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Dashboard } from '@newpick/shared';
import TodaySummary from './TodaySummary';

vi.mock('../period', () => ({
	useAdminQuery: () => ({ today: '2026-11-20', from: '2026-10-22', to: '2026-11-20', periodQuery: '' }),
	PeriodTitle: () => null,
	PeriodPicker: () => null,
}));

afterEach(cleanup);

// 한 사람이 3일 받음: 받은 사람 1명, 보낸 메일 3통
const data = (mail: Partial<Dashboard['mail']>) =>
	({
		crawling: { count: 0, latestAt: null },
		newsletters: { total: 0, items: [] },
		aiCost: { total: 0, unknown: 0 },
		summaryLogs: { total: 0, items: [] },
		mail: {
			activeSubscribers: 1,
			byDay: [
				{ day: '2026-11-20', recipients: 1 },
				{ day: '2026-11-19', recipients: 1 },
				{ day: '2026-11-18', recipients: 1 },
			],
			...mail,
		},
	}) as unknown as Dashboard;

describe('TodaySummary 메일 받은 사람', () => {
	it('api가 센 서로 다른 사람 수를 보여 주고, 날짜별 합은 보낸 메일 수로', () => {
		render(<TodaySummary data={data({ recipients: 1 })} />);
		expect(screen.getByText('1명')).toBeTruthy();
		expect(screen.getByText(/보낸 메일 3통/)).toBeTruthy();
	});

	it('웹이 먼저 배포돼 이전 api 응답에 recipients가 없어도 화면이 깨지지 않는다 (날짜별 합으로)', () => {
		render(<TodaySummary data={data({})} />);
		expect(screen.getByText('3명')).toBeTruthy();
	});
});

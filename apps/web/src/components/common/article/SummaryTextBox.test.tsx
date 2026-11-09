import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';

afterEach(cleanup);

const stories = [
	{ kicker: '미국 정치', heading: '밀러 임명', lead: '트럼프가 밀러를 비서실장에 임명했다.', morning: true },
	{ kicker: '중동', heading: '연정 구성권', lead: '이스라엘 대통령이 연정 구성권을 넘겼다.', morning: false },
];

describe('SummaryTextBox (AI 요약)', () => {
	it('소식 구조가 있으면 소식마다 번호 · 꼬리표 · 제목 · 리드 (요약 글 문장 순서와 짝짓지 않는다)', () => {
		render(<SummaryTextBox stories={stories}>{'순서가 어긋난 요약. 다른 문장.'}</SummaryTextBox>);
		expect(screen.getByText('오늘의 소식 2개')).toBeTruthy();
		expect(screen.getByRole('button', { name: /01.*아침 속보.*미국 정치.*밀러 임명.*비서실장에 임명/ })).toBeTruthy();
		expect(screen.queryByText('순서가 어긋난 요약.')).toBeNull();
	});

	it('소식 구조가 없으면(예전 뉴스레터) 요약 글을 문장 목록으로, 핵심 구절은 형광펜', () => {
		render(<SummaryTextBox>{'첫 ==핵심== 문장이다. 둘째 문장이다. 셋째 문장이다.'}</SummaryTextBox>);
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.getAllByRole('listitem')).toHaveLength(3);
		expect(screen.getByText('핵심').tagName).toBe('MARK');
	});
});

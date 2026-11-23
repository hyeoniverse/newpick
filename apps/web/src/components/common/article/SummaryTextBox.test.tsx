import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAutoScrolling } from '@/utils/autoScroll';
import { useHeaderStore } from '@/stores/useHeaderStore';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

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

	describe('누르면 본문 소식으로 (#342: 헤더가 펼쳐졌다 접히기를 반복하던 문제)', () => {
		function setup() {
			vi.useFakeTimers();
			vi.stubGlobal('matchMedia', () => ({ matches: false }));
			// 본문 소식 둘. 화면 아래에 있다
			const targets = [0, 1].map(() => {
				const el = document.createElement('article');
				el.className = 'story';
				el.getBoundingClientRect = () => ({ top: 2000 }) as DOMRect;
				el.scrollIntoView = vi.fn();
				document.body.appendChild(el);
				return el;
			});
			useHeaderStore.setState({ isOpen: true });
			render(<SummaryTextBox stories={stories} storySelector="article.story" />);
			fireEvent.click(screen.getByRole('button', { name: /연정 구성권/ }));
			return targets[1];
		}

		it('가는 동안 헤더는 한 번 접고, 스크롤 방향에 반응하지 않게 붙잡았다가 끝나면 놓는다', () => {
			const target = setup();
			expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
			expect(useHeaderStore.getState().isOpen).toBe(false);
			expect(isAutoScrolling()).toBe(true);
			vi.advanceTimersByTime(900 + 3000);
			expect(isAutoScrolling()).toBe(false);
		});

		it('가는 중에 사용자가 스크롤하면 자리 맞추기를 시작하지 않는다 (사용자 스크롤을 소식 자리로 되돌리지 않게)', () => {
			const target = setup();
			vi.advanceTimersByTime(300);
			window.dispatchEvent(new Event('wheel'));
			expect(isAutoScrolling()).toBe(false);
			vi.advanceTimersByTime(4000);
			// 처음 한 번 말고는 다시 부르지 않는다
			expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
		});
	});
});

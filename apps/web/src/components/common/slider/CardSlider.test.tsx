import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardSlider from './CardSlider';

// 카드 폭을 재려면 ref가 카드 요소에 닿아야 한다
vi.mock('@/components/common/Card', () => ({
	default: ({ data, ref }: { data: { main: { description: string } }; ref?: React.Ref<HTMLDivElement> }) => (
		<div ref={ref}>{data.main.description}</div>
	),
}));
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => ({ isMobile: false }) }));

const cards = [1, 2, 3].map((id) => ({ id, header: '', main: { description: `카드 ${id}` } }));
/** 한 번에 크게 돌리면 그 사이 상태가 반영되지 않아, 0.5초씩 나눠 돌린다 */
const wait = (ms: number) => {
	for (let t = 0; t < ms; t += 500) act(() => vi.advanceTimersByTime(500));
};
const current = () =>
	screen
		.getAllByRole('button')
		.find((b) => b.getAttribute('aria-current'))
		?.getAttribute('aria-label');

beforeEach(() => {
	vi.useFakeTimers();
	Element.prototype.scrollTo = () => {};
	globalThis.ResizeObserver = class {
		observe() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe('CardSlider 큰 배너 자동 넘김', () => {
	it('마우스를 올려 두면 넘기지 않고, 벗어나면 다시 넘긴다', () => {
		const { container } = render(<CardSlider type="main" data={cards} autoScrollInterval={1000} />);
		const slider = container.firstElementChild!;
		wait(1000);
		expect(current()).toBe('2번째 기사');

		fireEvent.pointerEnter(slider, { pointerType: 'mouse' });
		wait(1500); // 예전에는 이 사이에 3번째로 넘어갔다
		expect(current()).toBe('2번째 기사');
		wait(3000);
		expect(current()).toBe('2번째 기사');

		fireEvent.pointerLeave(slider, { pointerType: 'mouse' });
		wait(1500);
		expect(current()).toBe('3번째 기사');
	});

	it('손가락 터치는 멈추지 않는다 (휴대폰은 올려 두는 상태가 없다)', () => {
		const { container } = render(<CardSlider type="main" data={cards} autoScrollInterval={1000} />);
		fireEvent.pointerEnter(container.firstElementChild!, { pointerType: 'touch' });
		wait(1000);
		expect(current()).toBe('2번째 기사');
	});
});

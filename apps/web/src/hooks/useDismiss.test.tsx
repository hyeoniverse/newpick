import { cleanup, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDismiss } from './useDismiss';

type Props = Omit<Parameters<typeof useDismiss>[0], 'refs'>;

function Popup(props: Props) {
	const ref = useRef<HTMLDivElement>(null);
	useDismiss({ ...props, refs: [ref] });
	return (
		<div>
			<div ref={ref} data-testid="inside">
				목록
			</div>
			<div data-testid="outside">바깥</div>
		</div>
	);
}

describe('useDismiss', () => {
	afterEach(cleanup);

	it('바깥을 누르면 닫고, 안을 누르면 그대로', () => {
		const onClose = vi.fn();
		const { getByTestId } = render(<Popup open onClose={onClose} />);
		fireEvent.mouseDown(getByTestId('inside'));
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.mouseDown(getByTestId('outside'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('닫혀 있으면 듣지 않는다', () => {
		const onClose = vi.fn();
		const { getByTestId } = render(<Popup open={false} onClose={onClose} />);
		fireEvent.mouseDown(getByTestId('outside'));
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).not.toHaveBeenCalled();
	});

	it('Esc로 닫고 afterEscape를 부른다 · escape: false면 Esc 무시', () => {
		const onClose = vi.fn();
		const afterEscape = vi.fn();
		const { rerender } = render(<Popup open onClose={onClose} afterEscape={afterEscape} />);
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(afterEscape).toHaveBeenCalledTimes(1);

		rerender(<Popup open onClose={onClose} escape={false} />);
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("escape: 'stop'이면 바깥(창)의 Esc 처리까지 가지 않는다", () => {
		const onClose = vi.fn();
		const outer = vi.fn();
		window.addEventListener('keydown', outer);
		render(<Popup open onClose={onClose} escape="stop" />);
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
		window.removeEventListener('keydown', outer);
	});

	it('scroll: 숫자면 그만큼 넘게 움직일 때만 닫는다', () => {
		const onClose = vi.fn();
		render(<Popup open onClose={onClose} scroll={40} />);
		Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
		fireEvent.scroll(window);
		expect(onClose).not.toHaveBeenCalled();
		Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
		fireEvent.scroll(window);
		expect(onClose).toHaveBeenCalledTimes(1);
		Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
	});

	it("scroll: 'outside'면 안쪽 스크롤은 그대로, 바깥 스크롤은 닫는다 · resize도 닫는다", () => {
		const onClose = vi.fn();
		const { getByTestId } = render(<Popup open onClose={onClose} scroll="outside" resize />);
		fireEvent.scroll(getByTestId('inside'));
		expect(onClose).not.toHaveBeenCalled();
		fireEvent.scroll(getByTestId('outside'));
		expect(onClose).toHaveBeenCalledTimes(1);
		fireEvent(window, new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(2);
	});
});

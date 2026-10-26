import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/theme';
import { useModalStore } from '@/stores/useModalStore';
import Modal from '@/components/common/modal/ModalContainer';

beforeAll(() => {
	// jsdom에는 포인터 캡처가 없다
	HTMLElement.prototype.setPointerCapture = () => {};
});
afterEach(cleanup);
beforeEach(() => useModalStore.setState({ isOpen: false, content: null, variant: 'dialog' }));

const open = (variant: 'dialog' | 'sheet') => {
	render(
		<ThemeProvider theme={lightTheme}>
			<Modal />
		</ThemeProvider>,
	);
	act(() => useModalStore.getState().openModal(<p>내용</p>, { variant }));
};
const handle = () => screen.getByRole('button', { name: /닫기/ });
const dialog = () => screen.getByRole('dialog');
/** ms 동안 dy만큼 끌었다 놓는다 (빠르게 튕겨 내리면 짧아도 닫히므로 시간을 정한다) */
const drag = (dy: number, ms = 1000) => {
	const now = vi.spyOn(performance, 'now').mockReturnValue(0);
	fireEvent.pointerDown(handle(), { clientY: 100, pointerId: 1 });
	now.mockReturnValue(ms);
	fireEvent.pointerMove(handle(), { clientY: 100 + dy, pointerId: 1 });
	fireEvent.pointerUp(handle(), { clientY: 100 + dy, pointerId: 1 });
};
const closing = () => dialog().parentElement!.classList.contains('fade-out');

describe('시트 (#52)', () => {
	it('시트에는 X 버튼 대신 핸들, 대화상자에는 X 버튼', () => {
		open('sheet');
		expect(screen.queryByRole('button', { name: 'Close modal' })).toBeNull();
		expect(handle()).toBeTruthy();
		cleanup();

		open('dialog');
		expect(screen.getByRole('button', { name: 'Close modal' })).toBeTruthy();
		expect(screen.queryByRole('button', { name: /끌어 내려도/ })).toBeNull();
	});

	it('핸들을 조금만 끌면 제자리로 돌아온다', () => {
		open('sheet');
		drag(30);
		expect(closing()).toBe(false);
		expect(dialog().style.transform).toBe('');
	});

	it('핸들을 충분히 끌어 내리면 닫힌다', () => {
		open('sheet');
		drag(200);
		expect(closing()).toBe(true);
	});

	it('짧게라도 빠르게 튕겨 내리면 닫힌다', () => {
		open('sheet');
		drag(40, 30);
		expect(closing()).toBe(true);
	});

	it('위로는 끌리지 않는다', () => {
		open('sheet');
		fireEvent.pointerDown(handle(), { clientY: 100, pointerId: 1 });
		fireEvent.pointerMove(handle(), { clientY: 20, pointerId: 1 });
		expect(dialog().style.transform).toBe('');
	});

	it('핸들을 누르기만 하면(키보드 포함) 닫힌다', () => {
		open('sheet');
		fireEvent.click(handle(), { detail: 0 });
		expect(closing()).toBe(true);
	});
});

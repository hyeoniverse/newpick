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
beforeEach(() => useModalStore.setState({ isOpen: false, content: null, size: 'small' }));

const open = (size: 'small' | 'large' = 'small') => {
	render(
		<ThemeProvider theme={lightTheme}>
			<Modal />
		</ThemeProvider>,
	);
	act(() => useModalStore.getState().openModal(<p>내용</p>, { size }));
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
	it('모든 모달은 X 버튼 없이 핸들이 있는 시트, large는 넓은 시트', () => {
		open();
		expect(screen.queryByRole('button', { name: 'Close modal' })).toBeNull();
		expect(handle()).toBeTruthy();
		expect(dialog().classList.contains('small')).toBe(true);
		cleanup();

		open('large');
		expect(dialog().classList.contains('large')).toBe(true);
	});

	it('열려 있는 동안 뒤 화면은 스크롤되지 않고, 닫히면 되돌린다', () => {
		document.body.style.overflow = 'auto';
		open();
		expect(document.body.style.overflow).toBe('hidden');
		act(() => useModalStore.getState().closeModal());
		expect(document.body.style.overflow).toBe('auto');
	});

	it('핸들을 조금만 끌면 제자리로 돌아온다 (끌기 뒤에 오는 click으로 닫히지 않음)', () => {
		open();
		drag(30);
		fireEvent.click(handle(), { detail: 1 });
		expect(closing()).toBe(false);
		expect(dialog().style.transform).toBe('');
	});

	it('핸들을 충분히 끌어 내리면 닫힌다', () => {
		open();
		drag(200);
		expect(closing()).toBe(true);
	});

	it('짧게라도 빠르게 튕겨 내리면 닫힌다', () => {
		open();
		drag(40, 30);
		expect(closing()).toBe(true);
	});

	it('위로는 끌리지 않는다', () => {
		open();
		fireEvent.pointerDown(handle(), { clientY: 100, pointerId: 1 });
		fireEvent.pointerMove(handle(), { clientY: 20, pointerId: 1 });
		expect(dialog().style.transform).toBe('');
	});

	it('핸들을 누르기만 하면(키보드 포함) 닫힌다', () => {
		open();
		fireEvent.click(handle(), { detail: 0 });
		expect(closing()).toBe(true);
	});
});

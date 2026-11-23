import { afterEach, describe, expect, it, vi } from 'vitest';
import { openLoginPopup } from '@/utils/loginPopup';

afterEach(() => {
	vi.restoreAllMocks();
	document.cookie = 'logged_in=; Max-Age=0; Path=/';
});

describe('openLoginPopup', () => {
	it('팝업이 막히면 blocked', async () => {
		vi.spyOn(window, 'open').mockReturnValue(null);
		await expect(openLoginPopup()).resolves.toBe('blocked');
	});

	it("기다리는 중에 '다시 열기'를 누르면 창만 다시 띄우고 같은 기다림을 쓴다 (#340: 확인이 쌓였다)", async () => {
		const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);
		const interval = vi.spyOn(window, 'setInterval');

		const first = openLoginPopup();
		const second = openLoginPopup();

		expect(second).toBe(first);
		expect(open).toHaveBeenCalledTimes(2);
		expect(interval).toHaveBeenCalledTimes(1);

		// 로그인 표시 쿠키가 생기고 이 창으로 돌아오면 끝
		document.cookie = 'logged_in=1; Path=/';
		window.dispatchEvent(new Event('focus'));
		await expect(first).resolves.toBe('ok');

		// 끝난 뒤에는 새로 기다린다
		expect(openLoginPopup()).not.toBe(first);
	});
});

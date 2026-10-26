import { createElement, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lightTheme } from '@/styles/theme';
import { User } from '@/models/user.model';
import SubscribeSheet from '@/components/common/article/SubscribeSheet';
import SubscribeInduce from '@/components/common/article/SubscribeInduce';
import useInterestsStore from '@/stores/useInterestStore';
import { useInputCheckStore } from '@/stores/useInputCheckStore';

let user: Partial<User> | null = null;
const handleSubscribe = vi.fn();
const openModal = vi.fn();
const closeModal = vi.fn();

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user }) }));
vi.mock('@/hooks/useModal', () => ({ useModal: () => ({ openModal, closeModal }) }));
vi.mock('@/hooks/useSubscribe', () => ({
	default: () => ({ status: user?.isSubscribed, isChanging: false, handleSubscribe }),
}));
vi.mock('next/link', () => ({ default: ({ children }: { children: ReactNode }) => children }));

const renderWithTheme = (node: ReactNode) => render(createElement(ThemeProvider, { theme: lightTheme }, node));
const chip = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const submit = () => screen.getByRole('button', { name: /구독하기|분야를 골라/ }) as HTMLButtonElement;

afterEach(cleanup);

beforeEach(() => {
	vi.clearAllMocks();
	// 선택 분야와 약관 체크는 전역 스토어라 테스트마다 비운다
	useInterestsStore.setState({ selectedInterests: [] });
	useInputCheckStore.setState({ values: {} });
	user = { id: 1, isSubscribed: null };
});

describe('SubscribeSheet (#52)', () => {
	it('분야를 고르고 약관에 동의해야 구독 버튼이 켜진다', () => {
		renderWithTheme(createElement(SubscribeSheet));
		expect(submit().disabled).toBe(true);

		fireEvent.click(chip('IT'));
		expect(chip('IT').getAttribute('aria-pressed')).toBe('true');
		expect(submit().textContent).toBe('1개 분야 구독하기');
		expect(submit().disabled).toBe(true); // 약관 동의 전

		fireEvent.click(screen.getByRole('checkbox'));
		expect(submit().disabled).toBe(false);
	});

	it('"전체"는 모든 분야를 고른다', () => {
		renderWithTheme(createElement(SubscribeSheet));
		fireEvent.click(chip('전체'));
		expect(chip('세계').getAttribute('aria-pressed')).toBe('true');
		expect(submit().textContent).toBe('전체 분야 구독하기');
	});

	it('일시정지했다 다시 시작하는 사용자는 약관 동의 없이 구독할 수 있다', () => {
		user = { id: 1, isSubscribed: false };
		renderWithTheme(createElement(SubscribeSheet));
		fireEvent.click(chip('경제'));
		expect(submit().disabled).toBe(false);
	});

	it('구독에 성공하면 완료 안내로 바꾼다', async () => {
		handleSubscribe.mockResolvedValue(true);
		renderWithTheme(createElement(SubscribeSheet));
		fireEvent.click(chip('IT'));
		fireEvent.click(screen.getByRole('checkbox'));
		await act(async () => fireEvent.click(submit()));

		expect(handleSubscribe).toHaveBeenCalledWith({ interests: ['IT'], isChecked: true });
		expect(openModal).toHaveBeenCalledTimes(1);
	});
});

describe('SubscribeInduce: 구독하기', () => {
	it('구독하지 않은 사용자는 마이페이지로 가지 않고 시트를 연다', () => {
		renderWithTheme(createElement(SubscribeInduce));
		fireEvent.click(screen.getByRole('button', { name: '구독하기' }));

		const [content, options] = openModal.mock.calls[0];
		expect(content.type).toBe(SubscribeSheet);
		expect(options).toEqual({ variant: 'sheet' });
	});

	it('이미 구독 중이면 안내 모달 (시트 아님)', () => {
		user = { id: 1, isSubscribed: true };
		renderWithTheme(createElement(SubscribeInduce));
		fireEvent.click(screen.getByRole('button', { name: '구독하기' }));

		const [content, options] = openModal.mock.calls[0];
		expect(content.type).not.toBe(SubscribeSheet);
		expect(options).toBeUndefined();
	});
});

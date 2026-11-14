import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CategoryTags from '@/components/common/article/CategoryTags';
import { CATEGORIES } from '@/constants/categories';
import { useInterestStore } from '@/stores/useInterestStore';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null }) }));

const chipNames = () => screen.getAllByRole('button').map((b) => b.textContent);

afterEach(cleanup);
beforeEach(() => useInterestStore.getState().setSelectedInterests([]));

describe('CategoryTags', () => {
	it("여러 개 고르기(기본)는 맨 앞에 '전체'까지", () => {
		render(<CategoryTags />);
		expect(chipNames()).toEqual(CATEGORIES.map((c) => c.name));
		expect(chipNames()[0]).toBe('전체');
	});

	it("'전체'를 누르면 모두 고르고 모두 강조, 다시 누르면 모두 해제", () => {
		render(<CategoryTags />);
		fireEvent.click(screen.getByRole('button', { name: '전체' }));
		expect(useInterestStore.getState().selectedInterests).toEqual(CATEGORIES.map((c) => c.name));
		expect(screen.getAllByRole('button').every((b) => b.classList.contains('active'))).toBe(true);

		fireEvent.click(screen.getByRole('button', { name: '전체' }));
		expect(useInterestStore.getState().selectedInterests).toEqual([]);
	});

	it("하나만 고르기('single' · 'localSingle')는 '전체' 없이", () => {
		render(<CategoryTags selectType="single" />);
		expect(chipNames()).not.toContain('전체');
		cleanup();
		render(<CategoryTags selectType="localSingle" selected="IT" onSelect={() => {}} />);
		expect(chipNames()).toEqual(CATEGORIES.slice(1).map((c) => c.name));
	});
});

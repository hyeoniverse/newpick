import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { lightTheme } from '@/styles/theme';
import LegalDocument from '@/components/common/legal/LegalDocument';

beforeAll(() => {
	// jsdom에는 IntersectionObserver가 없다 (목차 강조)
	globalThis.IntersectionObserver = class {
		observe() {}
		disconnect() {}
	} as unknown as typeof IntersectionObserver;
});
afterEach(cleanup);

describe('약관 문서 (#59)', () => {
	it('글과 표의 이메일은 메일 쓰기, 주소는 새 탭 링크로', () => {
		render(
			createElement(
				ThemeProvider,
				{ theme: lightTheme },
				createElement(LegalDocument, {
					doc: 'privacy',
					title: '개인정보 처리방침',
					effectiveDate: '2026년 10월 27일',
					intro: '소개',
					sections: [
						{
							title: '문의',
							blocks: [
								'이메일 hello@newpick.app로 보내 주세요.',
								{ table: { head: ['받는 자', '국가'], rows: [['Oracle Corporation oracle.com/legal/privacy', '일본']] } },
							],
						},
					],
				}),
			),
		);
		expect(screen.getByRole('link', { name: 'hello@newpick.app' }).getAttribute('href')).toBe('mailto:hello@newpick.app');
		const oracle = screen.getByRole('link', { name: /oracle.com\/legal\/privacy/ });
		expect(oracle.getAttribute('href')).toBe('https://oracle.com/legal/privacy');
		expect(oracle.getAttribute('target')).toBe('_blank');
		// 탭: 지금 문서 표시
		expect(screen.getByRole('link', { name: '개인정보 처리방침' }).getAttribute('aria-current')).toBe('page');
	});
});

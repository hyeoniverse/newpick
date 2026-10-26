import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, describe, expect, it } from 'vitest';
import { lightTheme } from '@/styles/theme';
import ExternalLink from '@/components/common/ExternalLink';

afterEach(cleanup);

const renderLink = (props: Parameters<typeof ExternalLink>[0]) =>
	render(createElement(ThemeProvider, { theme: lightTheme }, createElement(ExternalLink, props)));

describe('ExternalLink (#59)', () => {
	it('새 탭 + noopener noreferrer, 화면 읽기 프로그램에 새 창임을 알린다', () => {
		renderLink({ href: 'https://kopico.go.kr', children: 'kopico.go.kr' });
		const link = screen.getByRole('link', { name: 'kopico.go.kr (새 창에서 열림)' });
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		expect(link.querySelector('.external-icon')).not.toBeNull();
	});

	it('카드·아이콘 링크는 화살표를 끈다', () => {
		renderLink({ href: 'https://github.com', children: 'GitHub', showIcon: false });
		expect(screen.getByRole('link').querySelector('.external-icon')).toBeNull();
	});

	it('http(s)가 아닌 주소는 링크로 만들지 않는다', () => {
		renderLink({ href: 'javascript:alert(1)', children: '위험' });
		expect(screen.queryByRole('link')).toBeNull();
		expect(screen.getByText('위험')).toBeTruthy();
	});
});

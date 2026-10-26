import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { lightTheme } from '@/styles/theme';
import { useInputCheckStore } from '@/stores/useInputCheckStore';
import Button from '@/components/common/Button';
import InputCheck from '@/components/common/InputCheck';
import InputRadio from '@/components/common/InputRadio';
import InputSelect from '@/components/common/InputSelect';
import InputText from '@/components/common/InputText';

afterEach(cleanup);
beforeEach(() => useInputCheckStore.setState({ values: {} }));

const withTheme = (node: React.ReactNode) => render(<ThemeProvider theme={lightTheme}>{node}</ThemeProvider>);

function Select() {
	const [value, setValue] = useState('');
	return (
		<InputSelect
			name="field"
			label="분야"
			value={value}
			onChange={setValue}
			placeholder="분야를 고르세요"
			options={[
				{ label: 'IT', value: 'it' },
				{ label: '경제', value: 'economy' },
			]}
		/>
	);
}

describe('공통 입력 (#63)', () => {
	it('입력칸 이름표를 누르면 그 칸으로 간다', () => {
		withTheme(<InputText label="이메일" />);
		expect(screen.getByLabelText('이메일').tagName).toBe('INPUT');
	});

	it('선택 목록은 키보드로 열고 고르고, Esc로 닫는다', () => {
		withTheme(<Select />);
		const button = screen.getByRole('button', { name: '분야' });

		fireEvent.keyDown(button, { key: 'ArrowDown' });
		expect(button.getAttribute('aria-expanded')).toBe('true');
		fireEvent.keyDown(button, { key: 'ArrowDown' });
		fireEvent.keyDown(button, { key: 'Enter' });
		expect(button.textContent).toBe('경제');
		const economy = screen.getAllByRole('option', { hidden: true }).find((o) => o.textContent === '경제');
		expect(economy?.getAttribute('aria-selected')).toBe('true');

		fireEvent.keyDown(button, { key: 'Enter' });
		fireEvent.keyDown(button, { key: 'Escape' });
		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('체크 상자는 이름표가 항상 보이고, 이름표를 눌러도 체크된다', () => {
		withTheme(<InputCheck name="agree" label="약관에 동의합니다" />);
		fireEvent.click(screen.getByText('약관에 동의합니다'));
		expect((screen.getByRole('checkbox', { name: '약관에 동의합니다' }) as HTMLInputElement).checked).toBe(true);
	});

	it('로딩 중인 버튼은 다시 누를 수 없고 바쁨을 알린다', () => {
		withTheme(<Button isLoading>저장</Button>);
		const button = screen.getByRole('button', { name: '저장' });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		expect(button.getAttribute('aria-busy')).toBe('true');
	});
});

describe('라디오 버튼 (#63)', () => {
	function Radio() {
		const [value, setValue] = useState<'a' | 'b'>('a');
		return (
			<InputRadio
				name="pick"
				label="고르기"
				value={value}
				onChange={setValue}
				options={[
					{ label: '가', value: 'a' },
					{ label: '나', value: 'b' },
				]}
			/>
		);
	}

	it('묶음에서 하나만 고르고, 이름표를 눌러도 고른다', () => {
		withTheme(<Radio />);
		expect(screen.getByRole('group', { name: '고르기' })).toBeTruthy();
		fireEvent.click(screen.getByText('나'));
		expect((screen.getByRole('radio', { name: '나' }) as HTMLInputElement).checked).toBe(true);
		expect((screen.getByRole('radio', { name: '가' }) as HTMLInputElement).checked).toBe(false);
	});
});

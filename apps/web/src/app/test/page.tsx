'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { useModal } from '@/hooks/useModal';

import styled from 'styled-components';
import Modal from '@/components/common/modal/Modal';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import InputText from '@/components/common/InputText';
import InputCheck from '@/components/common/InputCheck';
import InputSelect from '@/components/common/InputSelect';
import InputDate from '@/components/common/InputDate';
import Spinner from '@/components/common/loader/Spinner';

const TestPage = () => {
	const { showToast, setPosition } = useToast();
	const { isOpen, modalType, openModal, closeModal } = useModal();
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [isChecked, setIsChecked] = useState(false);
	const [selectedOption, setSelectedOption] = useState('');

	const handleDateChange = (date: Date | null) => {
		setSelectedDate(date);
		console.log('Selected Date:', date);
	};

	const handleCheckboxChange = (name: string, checked: boolean) => {
		setIsChecked(checked);
		console.log(`Checkbox ${name} is now`, checked ? 'Checked' : 'Unchecked');
	};

	const handleSelectChange = (value: string) => {
		setSelectedOption(value);
		console.log('Selected Option:', value);
	};

	return (
		<StyledTestPage>
			<h1>공통 컴포넌트 테스팅</h1>

			<section>
				<h2>Toast</h2>
				<Button scheme="outline" onClick={() => showToast('정보 메시지입니다.', 'info')}>
					Show Info Toast
				</Button>
				<br />
				<Button scheme="primary" onClick={() => showToast('성공 메시지입니다!', 'success')}>
					Show Success Toast
				</Button>
				<br />
				<Button scheme="mono" onClick={() => showToast('경고 메시지입니다!', 'warning')}>
					Show Warning Toast
				</Button>
				<br />
				<Button scheme="danger" onClick={() => showToast('에러 발생!', 'error')}>
					Show Error Toast
				</Button>
				<br />
				<h3>위치 변경</h3>
				<Button onClick={() => setPosition('top-left')}>Top Left</Button>
				<Button onClick={() => setPosition('top-right')}>Top Right</Button>
				<Button onClick={() => setPosition('bottom-left')}>Bottom Left</Button>
				<Button onClick={() => setPosition('bottom-right')}>Bottom Right</Button>
				<Button onClick={() => setPosition('center-bottom')}>Center Bottom</Button>
			</section>

			<section>
				<h2>Modal</h2>
				<Button onClick={() => openModal('test')}>Open Test Modal</Button>
				{isOpen && modalType === 'test' && (
					<Modal isOpen={isOpen} onClose={closeModal}>
						<h2>Test Modal</h2>
						<p>모달 내용</p>
					</Modal>
				)}
			</section>

			<hr />
			<section>
				<h2>Button</h2>
				<Button scheme="primary" onClick={() => alert('Primary Button clicked!')}>
					클릭
				</Button>
				<Button scheme="secondary" onClick={() => alert('Secondary Button clicked!')}>
					클릭
				</Button>
			</section>

			<hr />
			<section>
				<h2>Title</h2>
				<Title size="extraLarge">ExtraLarge 타이틀</Title>
				<Title size="large">Large 타이틀</Title>
				<Title size="medium">Medium 타이틀</Title>
				<Title size="small">Small 타이틀</Title>
			</section>

			<hr />
			<section>
				<h2>InputText</h2>
				<InputText label="테스트 인풋" placeholder="테스트" />
			</section>

			<hr />
			<section>
				<h2>InputDate</h2>
				<InputDate label="날짜 선택" onChange={handleDateChange} />
				<p>선택된 날짜: {selectedDate?.toLocaleDateString() || '없음'}</p>
			</section>

			<hr />
			<section>
				<h2>InputCheck</h2>
				<InputCheck
					name="testCheckbox"
					label="테스트 체크박스"
					onChange={handleCheckboxChange}
					checked={isChecked}
				/>
				<p>체크 상태: {isChecked ? '체크됨' : '체크 안 됨'}</p>
			</section>

			<hr />
			<section>
				<h2>InputSelect</h2>
				<InputSelect
					name="testSelect"
					label="테스트 셀렉트"
					value={selectedOption}
					options={[
						{ label: '옵션 1', value: 'option1' },
						{ label: '옵션 2', value: 'option2' },
						{ label: '옵션 3', value: 'option3' },
					]}
					onChange={handleSelectChange}
				/>
				<p>선택된 옵션: {selectedOption || '없음'}</p>
			</section>

			<hr />
			<section>
				<h2>Loader</h2>
				<Spinner />
			</section>
		</StyledTestPage>
	);
};

const StyledTestPage = styled.div`
	padding: 2rem;
	font-family: Arial, sans-serif;

	h1 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
		color: ${({ theme }) => theme.color.primary};
	}

	section {
		margin-bottom: 2rem;

		h2 {
			font-size: 1.5rem;
			margin-bottom: 0.5rem;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin-top: 0.5rem;
			color: ${({ theme }) => theme.color.mediumGrey};
		}
	}

	label {
		margin-bottom: 0.5rem;
		display: block;
		color: ${({ theme }) => theme.color.text};
	}
`;

export default TestPage;

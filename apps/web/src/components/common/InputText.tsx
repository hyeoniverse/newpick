import React, { useId } from 'react';
import styled from 'styled-components';
import { fieldControl, fieldLabel } from '@/components/common/field';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onBlur'> {
	label?: string;
	placeholder?: string;
	inputType?: 'number' | 'select' | 'textarea' | 'text' | 'email' | 'password';
	onBlur?: (name: string, value: string) => void;
}

const InputText = React.forwardRef<HTMLInputElement, Props>(
	({ label, placeholder, inputType = 'text', onBlur, onChange, id, ...props }, ref) => {
		// 이름표를 누르면 칸에 초점이 가도록 연결한다
		const autoId = useId();
		const inputId = id ?? autoId;

		const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
			const { name, value } = e.target;
			if (onBlur) {
				onBlur(name, value);
			}
		};

		return (
			<StyledInputText className="input-text">
				{label && <label htmlFor={inputId}>{label}</label>}
				<input
					id={inputId}
					placeholder={placeholder}
					ref={ref}
					type={inputType}
					onBlur={handleBlur} // 커스텀 onBlur 전달
					onChange={onChange}
					{...props}
				/>
			</StyledInputText>
		);
	},
);

/** 이름표는 칸 위에 (다른 입력칸과 같게). 예전에는 옆에 붙어 좁으면 글자가 세로로 꺾였다 */
const StyledInputText = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;

	label {
		${fieldLabel}
	}

	input {
		${fieldControl}
	}
`;

InputText.displayName = 'InputText'; // Next.js에서 유용한 컴포넌트 이름 설정
export default InputText;

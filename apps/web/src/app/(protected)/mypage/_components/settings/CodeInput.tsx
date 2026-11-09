'use client';

import { useState } from 'react';
import { cx } from '@/styles/tw';

interface Props {
	id: string;
	value: string;
	onChange: (value: string) => void;
	/** 틀린 코드였을 때 칸을 빨갛게 */
	invalid?: boolean;
	length?: number;
	autoFocus?: boolean;
}

/**
 * 인증 코드 입력: 숫자 한 칸에 한 자리씩 보인다.
 * 실제 입력은 칸 위에 투명하게 겹친 input 하나라서 붙여넣기 · 휴대폰의 코드 자동 채우기(one-time-code) · 지우기가 그대로 된다
 */
export default function CodeInput({ id, value, onChange, invalid, length = 6, autoFocus }: Props) {
	const [focused, setFocused] = useState(false);
	const active = Math.min(value.length, length - 1);

	return (
		<div className={cx('np-mypage-code-input-code-input', invalid ? 'invalid' : undefined)}>
			<input
				id={id}
				inputMode="numeric"
				autoComplete="one-time-code"
				pattern={`\\d{${length}}`}
				maxLength={length}
				required
				value={value}
				onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				aria-invalid={invalid || undefined}
				autoFocus={autoFocus}
			/>
			<div className="cells" aria-hidden>
				{Array.from({ length }, (_, i) => (
					<span key={i} className={`cell${focused && i === active ? ' active' : ''}`}>
						{value[i] ?? (focused && i === active ? <i className="caret" /> : null)}
					</span>
				))}
			</div>
		</div>
	);
}

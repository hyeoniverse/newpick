'use client';

import { useEffect, useState } from 'react';
import { useAdminQuery } from './period';

/**
 * 주소의 검색어(param)와 맞춘 입력 값 (#230).
 * 치는 동안은 화면에만 두고, 주소가 바뀌면(뒤로 가기 · 다른 거르기) 그 값으로 다시 맞춘다
 */
export function useUrlDraft(param: string) {
	const { get } = useAdminQuery();
	const value = get(param);
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);
	return [draft, setDraft] as const;
}

/**
 * 관리자 목록의 검색 칸 하나 (#230): Enter를 누르면 주소의 param에 넣고 1쪽으로.
 * 비우고 Enter면 주소에서 뺀다
 */
export default function AdminSearchField({
	param,
	label,
	placeholder,
	ariaLabel,
	maxLength = 100,
}: {
	/** 주소 쿼리 이름 (예: q, email) */
	param: string;
	/** 칸 앞 이름표 */
	label: string;
	placeholder: string;
	ariaLabel: string;
	maxLength?: number;
}) {
	const { set } = useAdminQuery();
	const [draft, setDraft] = useUrlDraft(param);
	return (
		<form
			role="search"
			className="searches"
			onSubmit={(event) => {
				event.preventDefault();
				set({ [param]: draft.trim() || null });
			}}
		>
			<span className="chips-label">{label}</span>
			<input
				type="search"
				className="search"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				placeholder={placeholder}
				aria-label={ariaLabel}
				maxLength={maxLength}
			/>
		</form>
	);
}

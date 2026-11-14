'use client';

import { useRef, useState } from 'react';
import { useDismiss } from '@/hooks/useDismiss';
import { cx } from '@/styles/tw';
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuChevronDown } from 'react-icons/lu';

interface Option {
	label: string;
	value: string;
}

interface Props {
	/** 표 머리 글자 (예: '관심사') */
	label: string;
	options: Option[];
	/** 지금 고른 값. ''이면 거르지 않는 중 */
	value: string;
	onChange: (value: string) => void;
	/** 거르는 중일 때 머리 글자를 강조색으로 (기간처럼 늘 걸려 있는 건 끈다) */
	highlight?: boolean;
}

/* 표 머리 글자 단추: 글꼴 · 색은 표 머리를 따르고, 고른 · 정렬 중이면 글자 · 아이콘이 강조색 */
const trigger = (active: boolean) =>
	cx(
		'trigger inline-flex cursor-pointer items-center gap-1 p-0 [font:inherit] [&_svg]:size-3.5',
		active ? 'active text-primary [&_svg]:text-primary' : 'text-inherit [&_svg]:text-sub-text',
	);

/**
 * 표 머리에서 고르기 (공통, 관리자 표에서 시작). 머리 글자를 누르면 고를 목록이 열린다. 고른 값이 있으면 글자가 강조색.
 * 표는 좁은 화면에서 옆으로 넘기느라(overflow) 안쪽 목록이 잘리므로, 목록은 화면 기준(fixed)으로 띄운다.
 * 목록은 달력 · 시각 고르기와 같은 얇은 테두리 · 8px 모서리 · 그림자 없음
 */
export function HeaderSelect({ label, options, value, onChange, highlight = true }: Props) {
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const rootRef = useRef<HTMLSpanElement>(null);
	const open = pos !== null;

	// 바깥을 누르거나 Esc · 스크롤 · 창 크기 바꾸면 닫기 (fixed라 자리가 어긋나지 않게). 목록 안 스크롤은 그대로
	useDismiss({ open, refs: [rootRef], onClose: () => setPos(null), scroll: 'outside', resize: true });

	return (
		<span ref={rootRef}>
			<button
				type="button"
				className={trigger(!!value && highlight)}
				aria-haspopup="true"
				aria-label={`${label} 거르기${value ? ` (${options.find((o) => o.value === value)?.label ?? value})` : ''}`}
				aria-expanded={open}
				onClick={(event) => {
					if (open) return setPos(null);
					const rect = event.currentTarget.getBoundingClientRect();
					setPos({ top: rect.bottom + 4, left: rect.left });
				}}
			>
				{label}
				<LuChevronDown aria-hidden />
			</button>
			{pos && (
				<div
					className="menu fixed z-[950] flex max-h-64 min-w-36 flex-col overflow-y-auto overscroll-contain rounded-surface border border-solid border-border bg-background p-1.5 [scrollbar-width:thin]"
					role="group"
					aria-label={`${label}로 거르기`}
					style={{ top: pos.top, left: pos.left }}
				>
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							aria-pressed={option.value === value}
							className={cx(
								'cursor-pointer whitespace-nowrap rounded-[6px] px-2.5 py-[0.4375rem] text-left text-small',
								// 고른 항목 · 나머지 중 하나만 (같은 속성 클래스가 둘 붙지 않게)
								option.value === value
									? 'bg-tertiary font-semi-bold text-primary'
									: 'font-regular text-text hover:bg-neutral',
							)}
							onClick={() => {
								// 고른 항목을 다시 누르면 해제하고 '전체'('')로 (전체 항목이 있을 때)
								onChange(option.value === value && options.some((o) => o.value === '') ? '' : option.value);
								setPos(null);
							}}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</span>
	);
}

export type SortOrder = 'asc' | 'desc' | '';

/**
 * 표 머리 정렬 버튼 (공통). 누를 때마다 first → 반대 → 기본('')을 돈다.
 * 숫자는 큰 순(desc)부터, 글자는 가나다순(asc)부터 시작하게 first로 정한다
 */
export function SortButton({
	label,
	order,
	first = 'desc',
	onChange,
}: {
	label: string;
	/** 지금 순서. ''이면 이 칸으로 정렬하지 않는 중 */
	order: SortOrder;
	first?: 'asc' | 'desc';
	onChange: (next: SortOrder) => void;
}) {
	const second = first === 'desc' ? 'asc' : 'desc';
	const next: SortOrder = !order ? first : order === first ? second : '';
	const words: Record<string, string> =
		first === 'asc' ? { asc: '가나다순', desc: '가나다 역순' } : { asc: '작은 순', desc: '큰 순' };
	const Icon = order === 'desc' ? LuArrowDown : order === 'asc' ? LuArrowUp : LuArrowUpDown;
	return (
		<span>
			<button
				type="button"
				className={trigger(!!order)}
				aria-label={`${label} ${words[order] ?? ''} 정렬, 누르면 ${words[next] ?? '기본 순서'}`}
				onClick={() => onChange(next)}
			>
				{label}
				<Icon aria-hidden />
			</button>
		</span>
	);
}

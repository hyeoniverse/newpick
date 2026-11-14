'use client';

import React, { useEffect, useId, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDropdown } from '@/hooks/useDropdown';
import { useDismiss } from '@/hooks/useDismiss';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
	type: string | string[];
	children: React.ReactNode;
	toggleButton?: React.ReactNode;
	/** 바깥 틀에 줄 인라인 스타일 (drawer의 줄 수 --n처럼 패널이 읽을 CSS 변수) */
	style?: React.CSSProperties;
	/** 여닫는 버튼의 이름 (화면 읽기 프로그램용). 버튼 안이 그림뿐이라 꼭 준다 */
	label: string;
	/** 오버레이가 깔리는 메뉴(drawer): 오버레이를 눌러 닫을 때 그 클릭이 뒤 화면까지 가지 않게 */
	overlay?: boolean;
}

/** 버튼으로 여닫는 메뉴. 키보드로도 열고(Enter · Space) Esc로 닫으면 버튼으로 포커스를 돌린다 (#16) */
const Dropdown = ({ type, children, toggleButton, className, label, style, overlay = false }: Props) => {
	const pathname = usePathname();
	const { isDropdownOpen, closeDropdown, toggleDropdown } = useDropdown(type);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	useEffect(() => {
		closeDropdown();
	}, [pathname, closeDropdown]);

	// 바깥을 누르거나 Esc면 닫기. Esc면 여는 단추로 포커스를 돌린다
	useDismiss({
		open: isDropdownOpen,
		refs: [dropdownRef],
		onClose: closeDropdown,
		afterEscape: () => buttonRef.current?.focus(),
		blockClickThrough: overlay,
	});

	return (
		<div ref={dropdownRef} className={cx('np-dropdown', className)} style={style}>
			<button
				ref={buttonRef}
				type="button"
				className="toggle-button"
				onClick={toggleDropdown}
				aria-label={label}
				aria-expanded={isDropdownOpen}
				aria-controls={panelId}
			>
				{toggleButton &&
					React.isValidElement(toggleButton) &&
					(toggleButton.type !== React.Fragment
						? React.cloneElement(toggleButton as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>, {
								// 안쪽 요소의 클래스(Tailwind)는 살리고 열림 표시만 더한다
								className: cx(
									(toggleButton as React.ReactElement<React.HTMLAttributes<HTMLDivElement>>).props.className,
									isDropdownOpen && 'open',
								),
							})
						: toggleButton)}
			</button>
			<div id={panelId} className={`panel ${isDropdownOpen ? 'open' : ''}`}>
				{children}
			</div>
		</div>
	);
};

export default Dropdown;

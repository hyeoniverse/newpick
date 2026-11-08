'use client';

import React, { useEffect, useId, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDropdown } from '@/hooks/useDropdown';
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
}

/** 버튼으로 여닫는 메뉴. 키보드로도 열고(Enter · Space) Esc로 닫으면 버튼으로 포커스를 돌린다 (#16) */
const Dropdown = ({ type, children, toggleButton, className, label, style }: Props) => {
	const pathname = usePathname();
	const { isDropdownOpen, closeDropdown, toggleDropdown } = useDropdown(type);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	useEffect(() => {
		closeDropdown();
	}, [pathname, closeDropdown]);

	// 외부 클릭 시 닫기
	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (!dropdownRef.current || dropdownRef.current.contains(event.target as Node)) return;
			closeDropdown();
		};

		if (isDropdownOpen) {
			document.addEventListener('mousedown', handleOutsideClick);
		}
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	}, [isDropdownOpen, closeDropdown]);

	// Esc로 닫기
	useEffect(() => {
		if (!isDropdownOpen) return;
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			closeDropdown();
			buttonRef.current?.focus();
		};
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	}, [isDropdownOpen, closeDropdown]);

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

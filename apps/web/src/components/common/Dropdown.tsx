'use client';

import React, { useEffect, useId, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useDropdown } from '@/hooks/useDropdown';
import styled from 'styled-components';

interface Props {
	className?: string;
	type: string | string[];
	children: React.ReactNode;
	toggleButton?: React.ReactNode;
	/** 여닫는 버튼의 이름 (화면 읽기 프로그램용). 버튼 안이 그림뿐이라 꼭 준다 */
	label: string;
}

/** 버튼으로 여닫는 메뉴. 키보드로도 열고(Enter · Space) Esc로 닫으면 버튼으로 포커스를 돌린다 (#16) */
const Dropdown = ({ type, children, toggleButton, className, label }: Props) => {
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
		<StyledDropdown ref={dropdownRef} className={`${className}`}>
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
								className: isDropdownOpen ? 'open' : '',
						  })
						: toggleButton)}
			</button>
			<div id={panelId} className={`panel ${isDropdownOpen ? 'open' : ''}`}>
				{children}
			</div>
		</StyledDropdown>
	);
};

const StyledDropdown = styled.div`
	position: relative;
	cursor: pointer;
	z-index: 1000;

	.toggle-button {
		display: block;
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;

		svg {
			width: ${({ theme }) => theme.fontSize.large};
			height: ${({ theme }) => theme.fontSize.large};
			aspect-ratio: 1 / 1;
			font-size: ${({ theme }) => theme.fontSize.large};
		}
	}

	&.auth {
		.panel {
			position: absolute;
			top: 2.75rem;
			right: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: 0 1rem;

			font-size: ${({ theme }) => theme.fontSize.small};
			background: ${({ theme }) => theme.color.surface};
			box-shadow: ${({ theme }) => theme.shadow.medium};
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			z-index: 1000;
			white-space: nowrap;

			visibility: hidden;
			opacity: 0;
			transform: scale(0);
			transform-origin: top right;
			overflow: hidden;
			transition: all 0.3s ease;

			&.open {
				width: fit-content;
				visibility: visible;
				opacity: 1;
				transform: scale(1);
			}

			a {
				padding: 0;
				margin: 0;
				width: 100%;
			}

			.item {
				width: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 1rem 2rem;

				font-size: ${({ theme }) => theme.fontSize.small};
				cursor: pointer;

				a {
					width: 100%;
					height: 100%;
					padding: 0;
					margin: 0;
				}

				button {
					width: 100%;
					height: 100%;
				}
			}

			.item:first-child {
				border-bottom: 1px solid ${({ theme }) => theme.color.border};
			}
		}
	}

	&.drawer {
		.toggle-button {
			display: none;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				display: block;
			}
		}

		.panel {
			visibility: hidden;
			position: absolute;
			top: calc(100% + 1rem - 2px);
			left: 0;
			margin-left: -1rem;
			background: ${({ theme }) => theme.color.surface};
			box-shadow: ${({ theme }) => theme.shadow.medium};

			display: flex;
			flex-direction: column;
			justify-content: center;

			transform-origin: top;
			transition: all 0.3s ease;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				width: 100vw;
				height: 0;

				border: 1px solid ${({ theme }) => theme.color.border};
				visibility: hidden;
				opacity: 0;
				transform: scaleY(0);
				overflow: hidden;

				&.open {
					height: fit-content;
					visibility: visible;
					opacity: 1;
					transform: scaleY(1);
				}
			}

			a {
				width: 100%;
				height: 100%;
				padding: 0;
				margin: 0;
			}

			button {
				width: 100%;
				padding: 0.75rem 0;
			}

			.item {
				width: 100%;
				height: 0;
				position: relative;
				visibility: hidden;
				opacity: 0;
				transform: scaleY(0);

				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;

				cursor: pointer;
				box-shadow: 0 -1px 0 ${({ theme }) => theme.color.border};
				font-weight: ${({ theme }) => theme.fontWeight.bold};

				transfrom-origin: top center;
				transition: transform 0.3s ease;

				&:hover {
					color: ${({ theme }) => theme.color.primary};
				}

				@media ${({ theme }) => theme.mediaQuery.tablet} {
					height: fit-content;
					/* 닫힌 메뉴의 항목이 탭으로 잡히지 않게, 보임 여부는 panel을 따른다 */
					visibility: inherit;
					opacity: 1;
					transform: scaleY(1);
				}
			}
		}
	}
`;

export default Dropdown;

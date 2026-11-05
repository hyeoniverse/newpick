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

	/* 메뉴 칸은 넘친 부분을 잘라 내므로 포커스 테두리를 안쪽에 그린다 */
	.panel :focus-visible {
		outline-offset: -2px;
	}

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

		/* 머리글 바로 아래로 펼쳐지는 메뉴 (태블릿 · 휴대폰). 뒤 화면은 그림자를 넓게 깔아 어둡게(머리글 위로는 자름) */
		.panel {
			display: none;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				position: fixed;
				top: var(--np-header-h, 3.5rem);
				left: 0;
				right: 0;
				display: block;
				padding: 0.5rem 1rem 1rem;
				border-bottom: 1px solid ${({ theme }) => theme.color.border};
				background: ${({ theme }) => theme.color.background};
				box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.32);
				clip-path: inset(0 -100vmax -100vmax -100vmax);
				cursor: default;

				visibility: hidden;
				opacity: 0;
				transform: translateY(-0.5rem);
				transition:
					opacity 0.2s ease,
					transform 0.2s ease,
					visibility 0.2s;

				&.open {
					visibility: visible;
					opacity: 1;
					transform: none;
				}

				@media (prefers-reduced-motion: reduce) {
					transition: none;
				}
			}

			nav {
				display: flex;
				flex-direction: column;
			}

			/* 뉴스레터 아래 분야 칩 (지금 분야는 채움) */
			.categories {
				display: flex;
				flex-wrap: wrap;
				gap: 0.5rem;
				margin: 0;
				padding: 0.25rem 0.75rem 0.75rem;
				list-style: none;
			}

			.category {
				display: inline-flex;
				align-items: center;
				min-height: 2.25rem;
				padding: 0 0.875rem;
				border: 1px solid ${({ theme }) => theme.color.border};
				border-radius: ${({ theme }) => theme.radius.chip};
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.text};

				&:hover {
					border-color: ${({ theme }) => theme.color.primary};
					color: ${({ theme }) => theme.color.primary};
				}

				&[aria-current='page'] {
					border-color: ${({ theme }) => theme.color.primary};
					background: ${({ theme }) => theme.color.primary};
					color: ${({ theme }) => theme.color.background};
				}
			}

			/* 메뉴 한 줄: 누르는 칸 넉넉히, 오른쪽 끝에 작은 화살표 */
			.item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				min-height: 3.25rem;
				padding: 0 0.75rem;
				border-radius: ${({ theme }) => theme.radius.control};
				font-size: ${({ theme }) => theme.fontSize.medium};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
				color: ${({ theme }) => theme.color.text};

				svg {
					width: 1.125rem;
					height: 1.125rem;
					color: ${({ theme }) => theme.color.subText};
				}

				&:hover {
					background: ${({ theme }) => theme.color.surface};
				}

				&[aria-current='page'] {
					background: ${({ theme }) => theme.color.tertiary};
					color: ${({ theme }) => theme.color.primary};

					svg {
						color: ${({ theme }) => theme.color.primary};
					}
				}
			}
		}
	}
`;

export default Dropdown;

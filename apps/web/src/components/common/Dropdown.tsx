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
		<StyledDropdown ref={dropdownRef} className={`${className}`} style={style}>
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
				border-bottom: 1px solid transparent;
				cursor: default;
				/* 뒤 화면 어둡게: 패널 뒤에 고정 덮개(::before, z-index -1)를 두고 투명도만 바꾼다 (그림자 100vmax를 매 프레임 다시 그리면 버벅인다).
				   덮개는 패널 바탕보다 위에 그려지므로, 메뉴 바탕색은 안쪽 nav에 준다 */
				isolation: isolate;

				&::before {
					content: '';
					position: fixed;
					top: var(--np-header-h, 3.5rem);
					right: 0;
					bottom: 0;
					left: 0;
					z-index: -1;
					background: rgba(0, 0, 0, 0.32);
					opacity: 0;
					pointer-events: none;
					transition: opacity 0.3s ease;
				}

				/* 아코디언: 상위 메뉴가 한 줄씩 다 펼쳐진 뒤(1단계) 분야가 한 줄씩(2단계, --phase 1). 접을 때는 거꾸로. 줄 하나 0.2초, 줄 사이 0.07초 */
				--np-row-time: 0.2s;
				--np-row-gap: 0.07s;
				--np-rows-total: calc(var(--np-row-time) * 2 + var(--np-row-gap) * (var(--n, 5) - 1));

				visibility: hidden;
				transition:
					border-color 0.3s ease,
					visibility 0s linear var(--np-rows-total);

				&.open {
					visibility: visible;
					border-bottom-color: ${({ theme }) => theme.color.border};
					transition:
						border-color 0.3s ease,
						visibility 0s;

					&::before {
						opacity: 1;
					}
				}

				/* 줄 하나: 높이 0에서 내용 높이까지(grid 0fr → 1fr) 펼쳐지며 글자는 살짝 내려오며 나타난다. 접을 때는 순서를 뒤집어 아래 줄부터 */
				.row {
					/* 접기: 2단계 줄(분야)이 먼저, 1단계 줄은 분야가 다 접힌(줄 하나 시간) 뒤 */
					--np-row-delay: calc(
						(var(--n, 5) - 1 - var(--i, 0)) * var(--np-row-gap) + (1 - var(--phase, 0)) * var(--np-row-time)
					);
					display: grid;
					grid-template-rows: 0fr;
					/* 줄 안 배치가 바뀌어도 바깥을 다시 계산하지 않게 */
					contain: layout paint;
					transition: grid-template-rows var(--np-row-time) ease-in var(--np-row-delay);
				}

				.row-body {
					min-height: 0;
					overflow: hidden;
					opacity: 0;
					transform: translateY(-0.375rem);
					transition:
						opacity var(--np-row-time) ease-in var(--np-row-delay),
						transform var(--np-row-time) ease-in var(--np-row-delay);
				}

				&.open .row {
					/* 펼치기: 1단계 줄이 순서대로, 2단계 줄은 1단계가 다 펼쳐진(줄 하나 시간) 뒤 순서대로 */
					--np-row-delay: calc(var(--i, 0) * var(--np-row-gap) + var(--phase, 0) * var(--np-row-time));
					grid-template-rows: 1fr;
					transition-timing-function: ease-out;
				}

				&.open .row-body {
					opacity: 1;
					transform: none;
					transition-timing-function: ease-out;
				}

				@media (prefers-reduced-motion: reduce) {
					transition: none;

					.row,
					.row-body,
					&.open .row {
						transition: none;
					}
				}
			}

			nav {
				display: flex;
				flex-direction: column;
				padding: 0 1rem;
				background: ${({ theme }) => theme.color.background};

				/* 위아래 여백은 안쪽 끝 요소의 margin으로 (접히면 overflow hidden 안에서 여백까지 0이 되게. padding은 남는다) */
				> :first-child .row-body > :first-child {
					margin-top: 0.5rem;
				}

				> :last-child .row-body > :last-child {
					margin-bottom: 1rem;
				}
			}

			/* 분야가 강조되면 위 '뉴스레터' 줄은 글자색만: 상위 · 하위가 같은 바탕으로 붙어 보이지 않게 (줄 틀 .row 다음의 분야 목록을 본다) */
			.row:has(+ .categories [aria-current='page']) .item[aria-current='page'] {
				background: transparent;
			}

			/* 뉴스레터 아래 분야: 위 메뉴와 같은 줄 모양을 한 단계 작게 들여 쓴 목록. 지금 분야는 연한 강조색 바탕 · 강조색 */
			.categories {
				display: flex;
				flex-direction: column;
				margin: 0.25rem 0 0.5rem;
				padding: 0;
				list-style: none;

				/* 공통 li::before(빈 칸)가 줄의 grid 칸을 하나 더 만들어 접히지 않게 하므로 없앤다 */
				li::before {
					content: none;
				}
			}

			.category {
				display: flex;
				align-items: center;
				min-height: 2.75rem;
				padding: 0 0.75rem 0 1.5rem;
				border-radius: ${({ theme }) => theme.radius.control};
				font-size: ${({ theme }) => theme.fontSize.small};
				color: ${({ theme }) => theme.color.text};

				&:hover {
					background: ${({ theme }) => theme.color.surface};
				}

				&[aria-current='page'] {
					background: ${({ theme }) => theme.color.tertiary};
					color: ${({ theme }) => theme.color.primary};
					font-weight: ${({ theme }) => theme.fontWeight.semiBold};
				}
			}

			/* 메뉴 한 줄: 누르는 칸 넉넉히 */
			.item {
				display: flex;
				align-items: center;
				min-height: 3.25rem;
				padding: 0 0.75rem;
				border-radius: ${({ theme }) => theme.radius.control};
				font-size: ${({ theme }) => theme.fontSize.medium};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
				color: ${({ theme }) => theme.color.text};

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

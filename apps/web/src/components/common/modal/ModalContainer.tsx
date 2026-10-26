'use client';

import { useModal } from '@/hooks/useModal';
import styled from 'styled-components';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

interface Props {
	onClose?: () => void; // 모달을 닫을 때 실행되는 함수
}

/** 시트를 이만큼 넘게 끌어 내리거나(시트 높이 비율, 최소 px) 빠르게 내리면 닫는다 (#52) */
const DRAG_CLOSE_RATIO = 0.25;
const DRAG_CLOSE_MIN = 80;
const DRAG_CLOSE_VELOCITY = 0.5; // px/ms

function Modal({ onClose }: Props) {
	const { isOpen, content, variant, closeModal } = useModal();
	const [isAnimating, setIsAnimating] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const previousFocusedElement = useRef<HTMLElement | null>(null);
	const drag = useRef<{ startY: number; startTime: number; dy: number } | null>(null);
	const isSheet = variant === 'sheet';

	const handleClose = () => {
		setIsAnimating(true);
	};

	// 시트 핸들 드래그: 놓았을 때 충분히 내렸으면 아래로 밀어내며 닫고, 아니면 제자리로
	const setSheetOffset = (dy: number, animate: boolean) => {
		const body = modalRef.current;
		if (!body) return;
		body.style.transition = animate ? 'transform 0.25s ease-out' : 'none';
		body.style.transform = dy ? `translateY(${dy}px)` : '';
	};

	const onHandlePointerDown = (e: React.PointerEvent) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		drag.current = { startY: e.clientY, startTime: performance.now(), dy: 0 };
	};

	const onHandlePointerMove = (e: React.PointerEvent) => {
		if (!drag.current) return;
		drag.current.dy = Math.max(0, e.clientY - drag.current.startY); // 위로는 끌리지 않게
		setSheetOffset(drag.current.dy, false);
	};

	const onHandlePointerUp = () => {
		if (!drag.current || !modalRef.current) return;
		const { dy, startTime } = drag.current;
		drag.current = null;
		const height = modalRef.current.offsetHeight;
		const fast = dy / (performance.now() - startTime) > DRAG_CLOSE_VELOCITY;
		if (dy > Math.max(DRAG_CLOSE_MIN, height * DRAG_CLOSE_RATIO) || (fast && dy > 20)) {
			setSheetOffset(height, true);
			handleClose();
		} else {
			setSheetOffset(0, true);
		}
	};

	// 끌지 않고 누르면(탭·Enter·Space) 닫기 버튼으로 동작
	const onHandleClick = (e: React.MouseEvent) => {
		if (e.detail === 0 || !modalRef.current?.style.transform) handleClose();
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			handleClose();
		}
	};

	const handleKeydown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			handleClose();
		}
	}, []);

	const handleAnimationEnd = () => {
		if (isAnimating) {
			setIsAnimating(false);
			onClose?.();
			closeModal();
		}
	};

	useEffect(() => {
		if (isOpen) {
			previousFocusedElement.current = document.activeElement as HTMLElement;
			window.addEventListener('keydown', handleKeydown);

			if (modalRef.current) {
				modalRef.current.focus();
			}
		} else {
			window.removeEventListener('keydown', handleKeydown);
		}

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			if (previousFocusedElement.current) {
				previousFocusedElement.current.focus();
			}
		};
	}, [isOpen, handleKeydown]);

	if (!isOpen && !isAnimating) return null;

	return createPortal(
		<StyledModal
			className={`${isAnimating ? 'fade-out' : 'fade-in'} ${variant}`} // 애니메이션 클래스 적용
			onClick={handleOverlayClick}
			onAnimationEnd={handleAnimationEnd}
		>
			<div className="modal-body" ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1}>
				{isSheet && (
					<button
						type="button"
						className="sheet-handle"
						aria-label="닫기 (아래로 끌어 내려도 닫힙니다)"
						onPointerDown={onHandlePointerDown}
						onPointerMove={onHandlePointerMove}
						onPointerUp={onHandlePointerUp}
						onPointerCancel={onHandlePointerUp}
						onClick={onHandleClick}
					/>
				)}
				<div className="modal-contents">{content}</div>
				{/* 시트는 핸들이 닫기 역할을 한다 */}
				{!isSheet && (
					<button className="modal-close" onClick={handleClose} aria-label="Close modal">
						<IoClose />
					</button>
				)}
			</div>
		</StyledModal>,
		document.body,
	);
}

const StyledModal = styled.div`
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	&.fade-in {
		animation: fade-in 0.3s ease-in-out forwards;
	}

	&.fade-out {
		animation: fade-out 0.3s ease-in-out forwards;
	}

	position: fixed;
	top: 0;
	left: 0;
	min-width: 100vw;
	min-height: 100vh;
	z-index: 1000;
	background: rgba(32, 29, 29, 0.6);

	/* Firefox */
	scrollbar-width: none;

	/* Webkit 기반 브라우저 (Chrome, Safari, Edge) */
	&::-webkit-scrollbar {
		display: none;
	}

	/* IE, Edge */
	-ms-overflow-style: none;

	.modal-body {
		width: fit-content;
		height: fit-content;
		min-width: ${({ theme }) => theme.layout.width.small};
		max-width: ${({ theme }) => theme.layout.width.large};
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		border-radius: ${({ theme }) => theme.borderRadius.medium};
		box-shadow: ${({ theme }) => theme.shadow.medium};
		background: ${({ theme }) => theme.color.background};

		transition: opacity 0.3s ease-in-out;
	}

	.modal-contents {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0.5rem 1rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}

	/* sheet (#52): 화면 아래에 붙어 올라오는 시트. 데스크톱은 폭을 좁혀 가운데, 모바일은 화면 폭 전체 */
	&.sheet .modal-body {
		@keyframes sheet-up {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}

		top: auto;
		bottom: 0;
		left: 0;
		right: 0;
		width: min(30rem, 100%);
		min-width: 0;
		max-width: none;
		max-height: 85vh;
		margin: 0 auto;
		overflow-y: auto;
		transform: none;
		align-items: stretch;
		padding: 1.75rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom));
		border-radius: ${({ theme }) => theme.borderRadius.medium} ${({ theme }) => theme.borderRadius.medium} 0 0;
		animation: sheet-up 0.3s ease-out;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			width: 100%;
			padding: 1.75rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
		}

		.modal-contents {
			padding: 0;
		}

		/* 핸들: 끌어 내리면 닫힘. 누르기 쉽게 영역은 넓게, 막대는 작게 */
		.sheet-handle {
			position: absolute;
			top: 0;
			left: 50%;
			width: 6rem;
			height: 1.75rem;
			margin-left: -3rem;
			padding: 0;
			border: none;
			background: transparent;
			cursor: grab;
			touch-action: none;

			&::before {
				content: '';
				position: absolute;
				top: 0.625rem;
				left: 50%;
				width: 2.5rem;
				height: 4px;
				margin-left: -1.25rem;
				border-radius: 2px;
				background: ${({ theme }) => theme.color.border};
			}

			&:active {
				cursor: grabbing;
			}

			&:focus-visible::before {
				background: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;

		border: none;
		color: ${({ theme }) => theme?.color?.text};
		background: transparent;
		cursor: pointer;

		svg {
			width: 2rem;
			height: 2rem;

			&:hover {
				color: ${({ theme }) => theme?.color?.primary};
				transform: rotate(90deg);
				transition: transform 0.3s ease;
			}
		}
	}
`;

export default Modal;

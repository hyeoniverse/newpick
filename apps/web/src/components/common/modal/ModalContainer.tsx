'use client';

import { useModal } from '@/hooks/useModal';
import styled from 'styled-components';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Props {
	onClose?: () => void; // 모달을 닫을 때 실행되는 함수
}

/** 시트를 이만큼 넘게 끌어 내리거나(시트 높이 비율, 최소 px) 빠르게 내리면 닫는다 (#52) */
const DRAG_CLOSE_RATIO = 0.25;
const DRAG_CLOSE_MIN = 80;
const DRAG_CLOSE_VELOCITY = 0.5; // px/ms

/** 시트 안에서 Tab으로 옮겨 다닐 수 있는 것들 */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 모든 모달은 화면 아래에서 올라오는 시트다 (#52).
 * 닫기: 핸들 끌어 내리기·핸들 탭(키보드 포함)·Esc·바깥 누르기. 열려 있는 동안 뒤 화면은 스크롤되지 않는다
 */
function Modal({ onClose }: Props) {
	const { isOpen, content, size, closeModal } = useModal();
	const [isAnimating, setIsAnimating] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const previousFocusedElement = useRef<HTMLElement | null>(null);
	const drag = useRef<{ startY: number; startTime: number; dy: number } | null>(null);
	// 끌기를 마치면 브라우저가 click을 한 번 더 보낸다. 끈 뒤의 click은 닫기로 치지 않는다
	const dragged = useRef(false);

	// 시트를 dy만큼 내린다 (0이면 제자리)
	const setSheetOffset = (dy: number, animate: boolean) => {
		const body = modalRef.current;
		if (!body) return;
		body.style.transition = animate ? 'transform 0.25s ease-out' : 'none';
		body.style.transform = dy ? `translateY(${dy}px)` : '';
	};

	// 아래로 밀어내며 닫는다. 바깥(투명 오버레이)의 fade-out 애니메이션이 끝나면 상태를 비운다
	const handleClose = useCallback(() => {
		const body = modalRef.current;
		if (body) setSheetOffset(body.offsetHeight, true);
		setIsAnimating(true);
	}, []);

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
		dragged.current = dy > 3;
		const height = modalRef.current.offsetHeight;
		const fast = dy / (performance.now() - startTime) > DRAG_CLOSE_VELOCITY;
		if (dy > Math.max(DRAG_CLOSE_MIN, height * DRAG_CLOSE_RATIO) || (fast && dy > 20)) {
			handleClose();
		} else {
			setSheetOffset(0, true);
		}
	};

	// 끌지 않고 누르면(탭·Enter·Space) 닫기 버튼으로 동작
	const onHandleClick = () => {
		if (dragged.current) {
			dragged.current = false;
			return;
		}
		handleClose();
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			handleClose();
		}
	};

	const handleKeydown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleClose();
				return;
			}
			// Tab이 시트 밖(뒤 화면)으로 나가지 않게 처음 ↔ 끝을 잇는다 (#16)
			if (e.key !== 'Tab' || !modalRef.current) return;
			const focusables = [...modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
				(el) => el.getClientRects().length > 0,
			);
			if (focusables.length === 0) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;
			if (e.shiftKey && (active === first || active === modalRef.current)) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && (active === last || !modalRef.current.contains(active))) {
				e.preventDefault();
				first.focus();
			}
		},
		[handleClose],
	);

	const handleAnimationEnd = (e: React.AnimationEvent) => {
		// 시트가 올라오는 애니메이션도 여기로 올라오므로, 바깥의 닫힘 애니메이션만 본다
		if (isAnimating && e.target === e.currentTarget) {
			setIsAnimating(false);
			onClose?.();
			closeModal();
		}
	};

	useEffect(() => {
		if (!isOpen) return;

		previousFocusedElement.current = document.activeElement as HTMLElement;
		window.addEventListener('keydown', handleKeydown);
		// 포커스를 옮길 때 페이지가 스크롤되지 않게
		modalRef.current?.focus({ preventScroll: true });
		// 시트 안의 첫 제목을 시트의 이름으로 (화면 읽기 프로그램이 '대화상자, ○○'로 읽는다)
		const heading = modalRef.current?.querySelector<HTMLElement>('h1, h2, h3');
		if (heading && modalRef.current) {
			heading.id ||= 'modal-title';
			modalRef.current.setAttribute('aria-labelledby', heading.id);
		}

		// 뒤 화면 스크롤 막기. body만 잠근다: html까지 잠그면 페이지가 맨 위로 튄다.
		// 스크롤바가 사라지며 화면이 옆으로 밀리지 않게 그 폭만큼 여백을 준다
		const saved = { overflow: document.body.style.overflow, pad: document.body.style.paddingRight };
		const scrollbar = window.innerWidth - document.documentElement.clientWidth;
		document.body.style.overflow = 'hidden';
		if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = saved.overflow;
			document.body.style.paddingRight = saved.pad;
			previousFocusedElement.current?.focus({ preventScroll: true });
		};
	}, [isOpen, handleKeydown]);

	if (!isOpen && !isAnimating) return null;

	return createPortal(
		<StyledModal
			className={isAnimating ? 'fade-out' : 'fade-in'}
			onClick={handleOverlayClick}
			onAnimationEnd={handleAnimationEnd}
		>
			<div className={`modal-body ${size}`} ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1}>
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
				<div className="modal-contents">{content}</div>
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
		animation: fade-in 0.2s ease-out forwards;
	}

	&.fade-out {
		animation: fade-out 0.25s ease-in forwards;
	}

	/* 바깥: 뒤 화면을 아주 약간만 어둡게 + 살짝 흐리게. 누르면 닫힌다 */
	position: fixed;
	inset: 0;
	z-index: 1000;
	background: rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);

	/* 시트: 화면 아래에 붙어 올라온다. 기본 30rem, large는 42rem(메일 폭 600px + 여백, #55), 모바일은 화면 폭 전체 */
	.modal-body {
		@keyframes sheet-up {
			from {
				transform: translateY(100%);
			}
			to {
				transform: translateY(0);
			}
		}

		--modal-pad: 1.5rem;
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		width: min(30rem, 100%);
		max-height: 85vh;
		margin: 0 auto;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.75rem var(--modal-pad) calc(var(--modal-pad) + env(safe-area-inset-bottom));

		display: flex;
		flex-direction: column;

		border-radius: ${({ theme }) => theme.radius.floating} ${({ theme }) => theme.radius.floating} 0 0;
		/* 바깥이 어둡지 않으니 위쪽 그림자와 테두리로 뒤 화면과 구분 */
		border: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: none;
		box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.14);
		background: ${({ theme }) => theme.color.background};
		animation: sheet-up 0.3s ease-out;

		&.large {
			width: min(42rem, 100%);
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			--modal-pad: 1.25rem;
			width: 100%;

			&.large {
				width: 100%;
			}
		}
	}

	.modal-contents {
		display: flex;
		flex-direction: column;
		width: 100%;
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
`;

export default Modal;

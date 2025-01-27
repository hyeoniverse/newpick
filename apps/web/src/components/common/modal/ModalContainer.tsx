'use client';

import { useModal } from '@/hooks/useModal';
import styled from 'styled-components';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

interface Props {
	onClose?: () => void; // 모달을 닫을 때 실행되는 함수
}

function Modal({ onClose }: Props) {
	const { isOpen, content, closeModal } = useModal();
	const [isAnimating, setIsAnimating] = useState(false);
	const modalRef = useRef<HTMLDivElement | null>(null);
	const previousFocusedElement = useRef<HTMLElement | null>(null);

	const handleClose = () => {
		setIsAnimating(true);
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
			className={isAnimating ? 'fade-out' : 'fade-in'} // 애니메이션 클래스 적용
			onClick={handleOverlayClick}
			onAnimationEnd={handleAnimationEnd}
		>
			<div className="modal-body" ref={modalRef} role="dialog" tabIndex={-1}>
				<div className="modal-contents">{content}</div>
				<button className="modal-close" onClick={handleClose} aria-label="Close modal">
					<IoClose />
				</button>
			</div>
		</StyledModal>,
		document.body
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
		max-width: ${({ theme }) => theme.layout.width.medium};
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

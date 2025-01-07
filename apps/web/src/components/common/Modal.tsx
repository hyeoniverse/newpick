'use client';

import styled from 'styled-components';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';

interface Props {
	children: React.ReactNode; // 모달 내부에 렌더링될 자식 컴포넌트
	isOpen: boolean; // 모달 열림 상태
	onClose: () => void; // 모달을 닫을 때 실행되는 함수
}

function Modal({ children, isOpen, onClose }: Props) {
	const [isAnimating, setIsAnimating] = useState(false); // 애니메이션 상태
	const modalRef = useRef<HTMLDivElement | null>(null); // 모달 내부 DOM 요소 참조
	const previousFocusedElement = useRef<HTMLElement | null>(null); // 모달이 열리기 전 포커스된 요소

	// 모달 닫기 핸들러
	const handleClose = () => {
		setIsAnimating(true); // 닫기 애니메이션 실행
	};

	// 모달 외부를 클릭했을 때 닫기
	const handleOverlayClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			handleClose();
		}
	};

	// ESC 키로 모달 닫기
	const handleKeydown = useCallback((e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			handleClose();
		}
	}, []);

	// 애니메이션 종료 시 모달 닫기 처리
	const handleAnimationEnd = () => {
		if (isAnimating) {
			setIsAnimating(false);
			onClose(); // 부모 컴포넌트에서 전달받은 닫기 함수 호출
		}
	};

	useEffect(() => {
		if (isOpen) {
			// 모달이 열리면 이전 포커스된 요소 저장 및 ESC 키 이벤트 리스너 추가
			previousFocusedElement.current = document.activeElement as HTMLElement;
			window.addEventListener('keydown', handleKeydown);

			if (modalRef.current) {
				modalRef.current.focus(); // 모달 내부에 포커스 설정
			}
		} else {
			// 모달이 닫히면 ESC 키 이벤트 리스너 제거
			window.removeEventListener('keydown', handleKeydown);
		}

		return () => {
			// 컴포넌트 언마운트 시 ESC 키 이벤트 리스너 제거 및 포커스 복원
			window.removeEventListener('keydown', handleKeydown);
			if (previousFocusedElement.current) {
				previousFocusedElement.current.focus();
			}
		};
	}, [isOpen, handleKeydown]);

	// 브라우저 환경에서만 포털 렌더링
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true); // 브라우저에서 렌더링되었음을 설정
		return () => setMounted(false); // 컴포넌트 언마운트 시 초기화
	}, []);

	if (!mounted || (!isOpen && !isAnimating)) return null; // 포털 렌더링 조건

	return createPortal(
		<StyledModal
			className={isAnimating ? 'fade-out' : 'fade-in'} // 애니메이션 클래스 적용
			onClick={handleOverlayClick}
			onAnimationEnd={handleAnimationEnd}
		>
			<div className="modal-body" ref={modalRef} role="dialog" tabIndex={-1}>
				<div className="modal-contents">{children}</div>
				<button className="modal-close" onClick={handleClose} aria-label="Close modal">
					<IoClose />
				</button>
			</div>
		</StyledModal>,
		document.body // 포털 렌더링 대상 DOM
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
	width: 100vw;
	height: 100vh;
	z-index: 1000;
	background: rgba(0, 0, 0, 0.6);

	/* 스크롤바 숨김 처리 (브라우저별 설정) */
	scrollbar-width: none; /* Firefox */
	&::-webkit-scrollbar {
		display: none; /* Webkit 기반 브라우저 (Chrome, Safari, Edge) */
	}
	-ms-overflow-style: none; /* IE, Edge */

	.modal-body {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: ${({ theme }) => theme?.borderRadius?.medium};
		box-shadow: ${({ theme }) => theme?.shadow?.medium};
		background: ${({ theme }) => theme?.color?.background};
		min-width: 30rem;
		max-width: 80vw;
		max-height: 80vh;
		min-height: 20rem;
		display: flex;
		flex-direction: column;
	}

	.modal-contents {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		padding: 0.5rem 1rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
	}

	.modal-close {
		border: none;
		color: ${({ theme }) => theme?.color?.text};
		background: transparent;
		cursor: pointer;
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 1000;

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

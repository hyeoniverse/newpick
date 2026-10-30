'use client';

import styled from 'styled-components';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { useCallback, useEffect, useState } from 'react';

/**
 * 바닥에 붙는 막대(예: 스크랩 고르기 막대)가 나타나면 위·아래 스크롤 버튼을 그 높이만큼 위로 올린다.
 * 막대에 ref로 달면, 막대가 있는 동안 높이를 --np-float-lift로 알리고 사라지면 되돌린다
 */
export function useLiftScrollButtons() {
	return useCallback((bar: HTMLElement | null) => {
		if (!bar) return;
		const root = document.documentElement;
		const observer = new ResizeObserver(() => root.style.setProperty('--np-float-lift', `${bar.offsetHeight}px`));
		observer.observe(bar);
		return () => {
			observer.disconnect();
			root.style.removeProperty('--np-float-lift');
		};
	}, []);
}

function ScrollButtons() {
	const [showButtons, setShowButtons] = useState(false);

	const handleScrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	const handleScrollToBottom = () => {
		window.scrollTo({
			top: document.body.scrollHeight,
			behavior: 'smooth',
		});
	};

	useEffect(() => {
		const handleScroll = () => {
			const footer = document.getElementById('footer-el');
			if (!footer) return;

			const footerTop = footer.offsetTop;
			const scrollBottom = window.scrollY + window.innerHeight;
			const isNearBottom = scrollBottom > footerTop;

			setShowButtons(window.scrollY > 100 && !isNearBottom);
		};

		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<ScrollButtonsContainer>
			{/* 숨어 있을 때는 탭으로도 잡히지 않게 (#16) */}
			<ScrollButton
				onClick={handleScrollToTop}
				className={showButtons ? 'fade-in' : 'fade-out'}
				aria-label="맨 위로"
				tabIndex={showButtons ? 0 : -1}
				aria-hidden={!showButtons}
			>
				<FaChevronUp aria-hidden />
			</ScrollButton>
			<ScrollButton
				onClick={handleScrollToBottom}
				className={showButtons ? 'fade-in' : 'fade-out'}
				aria-label="맨 아래로"
				tabIndex={showButtons ? 0 : -1}
				aria-hidden={!showButtons}
			>
				<FaChevronDown aria-hidden />
			</ScrollButton>
		</ScrollButtonsContainer>
	);
}

const ScrollButtonsContainer = styled.div`
	position: fixed;
	/* 바닥에 붙는 막대가 있으면 그 높이만큼 위로 (useLiftScrollButtons) */
	bottom: calc(1.5rem + var(--np-float-lift, 0px));
	transition: bottom 0.2s ease;
	right: 1.5rem;
	display: flex;
	flex-direction: column;
	z-index: 999;
`;

const ScrollButton = styled.button`
	height: 2.5rem;
	width: 2.5rem;
	cursor: pointer;
	color: ${({ theme }) => theme.color.primary};
	background: ${({ theme }) => theme.color.background};
	border: 0.5px solid ${({ theme }) => theme.color.border};
	opacity: 0;
	transform: translateY(10px);
	transition: opacity 0.3s ease, transform 0.3s ease;

	&:hover {
		background: ${({ theme }) => theme.color.tertiary};
	}

	&.fade-in {
		opacity: 80%;
		transform: translateY(0);
	}

	&.fade-out {
		opacity: 0;
		transform: translateY(60px);
	}

	svg {
		position: absolute;
		width: 1.25rem;
		height: 1.25rem;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
`;

export default ScrollButtons;

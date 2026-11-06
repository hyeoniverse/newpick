'use client';

import styled from 'styled-components';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { useCallback, useEffect, useState } from 'react';
import { useFloatStore } from '@/stores/useFloatStore';

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

/**
 * 위·아래 스크롤 버튼을 잠깐 숨긴다 (예: 카드를 끄는 동안 — 마우스를 누르고 있어 누를 수 없고, 아래에 뜨는 폴더 칸을 가린다).
 * active인 동안 <html data-np-hide-float>를 달고, 끝나면 뗀다
 */
export function useHideScrollButtons(active: boolean) {
	useEffect(() => {
		if (!active) return;
		const root = document.documentElement;
		root.setAttribute('data-np-hide-float', '');
		return () => root.removeAttribute('data-np-hide-float');
	}, [active]);
}

function ScrollButtons() {
	const [scrolled, setScrolled] = useState(false);
	// 휴대폰 아래 시트가 열려 있으면 잠깐 숨긴다
	const sheetOpen = useFloatStore((s) => s.sheetOpen);
	const showButtons = scrolled && !sheetOpen;

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

			setScrolled(window.scrollY > 100 && !isNearBottom);
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
	transition:
		bottom 0.2s ease,
		transform 0.25s ease,
		visibility 0.25s;
	right: 1.5rem;
	display: flex;
	flex-direction: column;
	z-index: 999;

	/* 잠깐 숨김 (useHideScrollButtons): 오른쪽 화면 밖으로 밀려 나갔다가 끝나면 다시 들어온다 */
	html[data-np-hide-float] & {
		transform: translateX(calc(100% + 1.5rem));
		visibility: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
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
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;

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

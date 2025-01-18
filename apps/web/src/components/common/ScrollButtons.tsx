'use client';

import styled from 'styled-components';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { useEffect, useState } from 'react';

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
			<ScrollButton onClick={handleScrollToTop} className={showButtons ? 'fade-in' : 'fade-out'}>
				<FaChevronUp />
			</ScrollButton>
			<ScrollButton onClick={handleScrollToBottom} className={showButtons ? 'fade-in' : 'fade-out'}>
				<FaChevronDown />
			</ScrollButton>
		</ScrollButtonsContainer>
	);
}

const ScrollButtonsContainer = styled.div`
	position: fixed;
	bottom: 1.5rem;
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

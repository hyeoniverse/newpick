'use client';

import { useEffect, useState } from 'react';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { useFloatStore } from '@/stores/useFloatStore';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
	newsId: number;
}

function MobileLikeLinkButton({ className, newsId }: Props) {
	const [scrolled, setScrolled] = useState(false);
	// 휴대폰 아래 시트가 열려 있으면 잠깐 숨긴다 (스크롤 단추와 같은 움직임)
	const sheetOpen = useFloatStore((s) => s.sheetOpen);
	const showButton = scrolled && !sheetOpen;

	useEffect(() => {
		const handleScroll = () => {
			const footer = document.getElementById('footer-el');
			if (!footer) return;

			const footerTop = footer.offsetTop;
			const scrollBottom = window.scrollY + window.innerHeight;

			if (scrollBottom > footerTop) {
				setScrolled(false);
			} else {
				setScrolled(window.scrollY > 100);
			}
		};

		// 컴포넌트 마운트 시 스크롤 이벤트 등록
		window.addEventListener('scroll', handleScroll);
		// 언마운트 = 해제
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<MobileLikeLinkButtonStyled className={className}>
			<BookmarkIcon
				newsId={newsId}
				newsletterId={newsId}
				className={`mobile-icon ${showButton ? 'fade-in ' : 'fade-out'}`}
			/>
			<LinkCopyIcon id={crypto.randomUUID()} className={`mobile-icon ${showButton ? 'fade-in ' : 'fade-out'}`} />
		</MobileLikeLinkButtonStyled>
	);
}

const MobileLikeLinkButtonStyled = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-articles-mobile-like-link-button-mobile-like-link-button', className)} {...props} />
);

export default MobileLikeLinkButton;

import { cx } from '@/styles/tw';

/**
 * 아이콘 버튼 공통 (북마크·링크 복사 등). 원형, 마우스를 올리면 바탕이 서서히 찬다 (styles/icon.css).
 * 아이콘 자체의 움직임은 아이콘마다 뜻에 맞게 따로 준다 (icons/Glyphs.tsx)
 */
export function IconStyled({ className, type = 'button', ...props }: React.ComponentProps<'button'>) {
	return <button type={type} className={cx('np-icon-button', className)} {...props} />;
}

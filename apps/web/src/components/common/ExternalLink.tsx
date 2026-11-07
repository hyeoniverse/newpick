import React from 'react';
import { LuArrowUpRight } from 'react-icons/lu';
import { cx } from '@/styles/tw';

interface Props extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> {
	href: string;
	children: React.ReactNode;
	/** 글 속 링크는 바깥으로 나간다는 작은 화살표를 붙인다. 카드·아이콘처럼 링크 자체가 덩어리면 끈다 */
	showIcon?: boolean;
}

const isWebUrl = (href: string) => /^https?:\/\//i.test(href);

/**
 * 사이트 밖으로 나가는 링크 (#59).
 * 새 탭 + rel="noopener noreferrer"(새 창이 이 페이지를 조작하지 못하게)를 늘 붙이고,
 * 화면 읽기 프로그램에는 "새 창에서 열림"을 알린다. http(s)가 아닌 주소(javascript: 등)는 링크로 만들지 않는다
 */
export default function ExternalLink({ href, children, showIcon = true, className, ...props }: Props) {
	if (!isWebUrl(href)) return <span className={className}>{children}</span>;

	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={cx('group', className)} {...props}>
			{children}
			{/* 마우스를 올리거나 키보드로 오면 화살표가 나가는 쪽(오른쪽 위)으로 살짝. 움직임 줄이기를 켰으면 가만히 */}
			{showIcon && (
				<LuArrowUpRight
					className="external-icon ml-[0.1em] inline-block size-[0.85em] align-[-0.05em] motion-safe:[transition:transform_0.2s_ease] motion-safe:group-hover:[transform:translate(0.12em,-0.12em)] motion-safe:group-focus-visible:[transform:translate(0.12em,-0.12em)]"
					aria-hidden
				/>
			)}
			{/* 화면에는 보이지 않고 화면 읽기 프로그램만 읽는다 */}
			<span className="sr-only">(새 창에서 열림)</span>
		</a>
	);
}

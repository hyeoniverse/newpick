'use client';

import Link from 'next/link';
import type { IconType } from 'react-icons';
import Button from '@/components/common/Button';
import { cx } from '@/styles/tw';

interface Props {
	icon: IconType;
	title: string;
	description?: string;
	/** 다음에 할 일. href면 이동, onClick이면 그 동작 */
	action?: { label: string; href?: string; onClick?: () => void };
	className?: string;
}

/**
 * 빈 화면 (#17): 북마크 없음, 구독 전 등. 오류 화면(ErrorState)과 같은 아이콘 · 제목 · 설명 · 버튼 차례를
 * 탭 안에 들어가는 크기로. 오류가 아니므로 색은 차분하게(테두리 원)
 */
export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
	return (
		<section
			className={cx(
				'mx-auto flex w-full max-w-md flex-col items-center gap-2.5 py-16 text-center [word-break:keep-all]',
				className,
			)}
		>
			<span
				className="badge mb-2 flex size-14 items-center justify-center rounded-full border border-solid border-border text-sub-text [&_svg]:size-6"
				aria-hidden
			>
				<Icon />
			</span>
			<h2 className="title m-0 text-medium font-bold leading-[1.4] text-text">{title}</h2>
			{description && (
				<p className="description m-0 whitespace-pre-line text-small leading-[1.6] text-sub-text">{description}</p>
			)}
			{action &&
				(action.href ? (
					<Link href={action.href} className="action mt-4 [&>span]:min-w-40 [&>span]:justify-center">
						<Button as="span" scheme="primary" size="medium">
							{action.label}
						</Button>
					</Link>
				) : (
					<Button className="action mt-4" scheme="primary" size="medium" onClick={action.onClick}>
						{action.label}
					</Button>
				))}
		</section>
	);
}

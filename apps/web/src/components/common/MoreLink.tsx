import Link from 'next/link';
import { cx } from '@/styles/tw';

interface Props {
	href: string;
	children: React.ReactNode;
	className?: string;
}

/** 다른 화면으로 가는 짧은 링크 (공통, 관리자 대시보드에서 시작): '전체 보기 →'. 누를 수 있는 것이라 강조색, 올리면 밑줄 */
export default function MoreLink({ href, children, className }: Props) {
	return (
		<Link
			href={href}
			className={cx(
				'inline-flex w-fit items-center gap-1 whitespace-nowrap text-small font-medium text-primary',
				'hover:underline hover:underline-offset-[0.2em] [&_svg]:size-3.5',
				className,
			)}
		>
			{children}
		</Link>
	);
}

'use client';

import BorderTitle from '@/components/common/BorderTitle';
import { cx } from '@/styles/tw';

interface Props {
	/** 구분선 제목 (HOW TO USE 등). 다른 섹션(EXPLORE · WHO WE ARE)과 같은 BorderTitle */
	label: string;
	title?: React.ReactNode;
	sub?: React.ReactNode;
	className?: string;
}

/** 시작하기 섹션 제목: 기존 구분선 제목 아래에 큰 제목과 한 줄 설명 */
export default function SectionHeading({ label, title, sub, className }: Props) {
	return (
		// header 태그는 레이아웃이 1024px 이하에서 좌우 여백을 넣으므로(MainLayout) div로
		<div className={cx('np-about-section-heading-heading', className)}>
			<BorderTitle text={label} className="border-title" as={title ? 'p' : 'h2'} />
			{title && <h2 className="heading">{title}</h2>}
			{sub && <p className="sub">{sub}</p>}
		</div>
	);
}

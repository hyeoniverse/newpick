'use client';

import { cx } from '@/styles/tw';
import { IoArrowBack } from 'react-icons/io5';
import Button from '@/components/common/Button';
import MoveButton from '@/components/common/MoveButton';
import { useHeader } from '@/hooks/useHeader';

interface Props {
	/** 버튼 글자 (예: '목록으로', '관리자 대시보드') */
	text: string;
	onClick: () => void;
	/** 옆에 한 줄로 띄울 제목. showTitle일 때만 보인다 (화면 읽기에서는 빼 둔다) */
	title?: string;
	showTitle?: boolean;
	/** 제목 칸을 누르면 (예: 기사 제목으로 올라가기). 주면 제목 칸이 단추가 된다 */
	onTitleClick?: () => void;
	className?: string;
}

/**
 * 뒤로 가기 막대 (공통, 기사 상세에서 시작). 페이지 흐름에선 제자리를 지키고, 스크롤하면 위에 붙는다.
 * 헤더가 펼쳐져 있으면 헤더(3rem) 아래, 접히면 맨 위로 같이 올라가며 글자를 접어 화살표만 남긴다.
 * 모양은 styles/back-bar.css (안의 단추를 덮어쓴다)
 */
export default function BackBar({ text, onClick, title, showTitle = false, onTitleClick, className }: Props) {
	const { isHeaderOpen } = useHeader();
	return (
		<div
			className={cx('np-back-bar', className)}
			data-folded={!isHeaderOpen || undefined}
			data-with-title={(!!title && showTitle) || undefined}
		>
			<MoveButton className="back" onClick={onClick} text={text} frontIcon={<IoArrowBack aria-hidden />} />
			{title &&
				(onTitleClick ? (
					// 숨어 있을 때(showTitle 아님)는 visibility: hidden이라 누를 수도, 탭으로 갈 수도 없다
					<Button
						type="button"
						scheme="monoOutline"
						className="bar-title"
						onClick={onTitleClick}
						aria-label={`제목으로 이동: ${title}`}
					>
						{title}
					</Button>
				) : (
					<p className="bar-title" aria-hidden>
						<span>{title}</span>
					</p>
				))}
		</div>
	);
}

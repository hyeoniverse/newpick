'use client';

import styled from 'styled-components';
import { IoArrowBack } from 'react-icons/io5';
import MoveButton from '@/components/common/MoveButton';
import { useHeader } from '@/hooks/useHeader';

interface Props {
	/** 버튼 글자 (예: '목록으로', '관리자 대시보드') */
	text: string;
	onClick: () => void;
	/** 옆에 한 줄로 띄울 제목. showTitle일 때만 보인다 (화면 읽기에서는 빼 둔다) */
	title?: string;
	showTitle?: boolean;
	className?: string;
}

/**
 * 뒤로 가기 막대 (공통, 기사 상세에서 시작). 페이지 흐름에선 제자리를 지키고, 스크롤하면 위에 붙는다.
 * 헤더가 펼쳐져 있으면 헤더(3rem) 아래, 접히면 맨 위로 같이 올라가며 글자를 접어 화살표만 남긴다
 */
export default function BackBar({ text, onClick, title, showTitle = false, className }: Props) {
	const { isHeaderOpen } = useHeader();
	return (
		<BackBarStyled className={className} $folded={!isHeaderOpen} $withTitle={!!title && showTitle}>
			<MoveButton className="back" onClick={onClick} text={text} frontIcon={<IoArrowBack aria-hidden />} />
			{title && (
				<p className="bar-title" aria-hidden>
					<span>{title}</span>
				</p>
			)}
		</BackBarStyled>
	);
}

const BackBarStyled = styled.div<{ $folded: boolean; $withTitle: boolean }>`
	position: sticky;
	top: ${({ $folded }) => ($folded ? '0.75rem' : 'calc(3rem + 0.75rem)')};
	z-index: 900;
	display: flex;
	align-items: stretch;
	gap: 0.5rem;
	width: fit-content;
	max-width: min(100%, 44rem);
	transition: top 0.3s ease;

	/* 제목 한 줄: 버튼과 같은 높이의 칸, 배경을 깔아 본문 위에서도 읽히게 */
	.bar-title {
		display: flex;
		align-items: center;
		min-width: 0;
		padding: 0 0.875rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.control};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.text};

		span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		opacity: ${({ $withTitle }) => ($withTitle ? 1 : 0)};
		transform: translateY(${({ $withTitle }) => ($withTitle ? '0' : '-0.25rem')});
		visibility: ${({ $withTitle }) => ($withTitle ? 'visible' : 'hidden')};
		transition:
			opacity 0.2s ease,
			transform 0.2s ease,
			visibility 0.2s;
	}

	.back {
		background: ${({ theme }) => theme.color.background};
		gap: ${({ $folded }) => ($folded ? '0' : '0.5rem')};
		transition:
			gap 0.3s ease,
			padding 0.3s ease;
	}

	.move-text {
		display: inline-block;
		overflow: hidden;
		white-space: nowrap;
		max-width: ${({ $folded }) => ($folded ? '0' : '10rem')};
		opacity: ${({ $folded }) => ($folded ? 0 : 1)};
		transition:
			max-width 0.3s ease,
			opacity 0.2s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		&,
		.back,
		.move-text,
		.bar-title {
			transition: none;
		}
	}
`;

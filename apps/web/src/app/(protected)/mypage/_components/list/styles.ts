import { css } from 'styled-components';

/**
 * 마이페이지 목록 공통 모양 (내 뉴스레터 · 북마크 · 스크랩이 같이 씀). 세 탭이 같은 말투로 보이게:
 * - listBox: 얇은 테두리 상자 한 장, 항목 사이 구분선 (메일 · 스크랩)
 * - sourceLine: 제목 위 작은 한 줄. 관심사(.category)는 보라 · 굵게, 나머지는 회색
 * - textTools: 항목 아래 글자 단추 줄 (원문에서 보기 · 폴더 옮기기 · 지우기 …)
 * - starToggle: 중요 표시 별 (꺼지면 회색 빈 별, 켜지면 보라 꽉 찬 별)
 * - folderTag: '모든 …'에서 보이는 폴더 이름표
 */
export const listBox = css`
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0 1.5rem;
	list-style: none;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		padding: 0 1rem;
	}

	> li {
		padding: 1rem 0;
	}

	> li + li {
		border-top: 1px solid ${({ theme }) => theme.color.border};
	}
`;

export const sourceLine = css`
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.125rem 0.375rem;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	color: ${({ theme }) => theme.color.subText};
	word-break: keep-all;
	font-variant-numeric: tabular-nums;

	.category {
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		color: ${({ theme }) => theme.color.primary};
	}
`;

export const textTools = css`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.25rem 1rem;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};

	/* 바로 아래 단추 · 링크와 폴더 메뉴 단추만 (펼친 폴더 메뉴 안에는 붙지 않게) */
	> a,
	> button,
	.trigger {
		padding: 0;
		font: inherit;
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}
`;

export const starToggle = css`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: ${({ theme }) => theme.radius.control};
	color: ${({ theme }) => theme.color.disabled};
	cursor: pointer;

	svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	&:hover {
		background: ${({ theme }) => theme.color.surface};
		color: ${({ theme }) => theme.color.primary};
	}

	&.on {
		color: ${({ theme }) => theme.color.primary};

		svg {
			fill: currentColor;
		}
	}
`;

export const folderTag = css`
	padding: 0 0.5rem;
	border-radius: ${({ theme }) => theme.radius.chip};
	background: ${({ theme }) => theme.color.surface};
	font-size: 0.75rem;
	font-weight: ${({ theme }) => theme.fontWeight.regular};
	color: ${({ theme }) => theme.color.subText};
`;

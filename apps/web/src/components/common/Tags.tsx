import styled from 'styled-components';

interface Props {
	tags?: string[] | null;
	/** 목록 카드처럼 좁은 곳에서는 앞의 몇 개만 */
	max?: number;
	className?: string;
}

/** 뉴스레터 키워드 (#50). 지난 뉴스레터 검색(#20)이 생기면 링크로 바꾼다 */
export default function Tags({ tags, max, className }: Props) {
	const shown = (tags ?? []).slice(0, max);
	if (!shown.length) return null;
	return (
		<StyledTags className={className} aria-label="키워드">
			{shown.map((tag) => (
				<li key={tag}>#{tag}</li>
			))}
		</StyledTags>
	);
}

const StyledTags = styled.ul`
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
	margin: 0;
	padding: 0;
	list-style: none;

	li {
		margin: 0;
		padding: 0.125rem 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		/* 강조색을 옅게: 배경은 primary의 연한 톤, 글자는 primary */
		background: ${({ theme }) => theme.color.tertiary};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.primary};
		white-space: nowrap;
	}
`;

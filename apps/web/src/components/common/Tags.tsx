import Link from 'next/link';
import styled from 'styled-components';

interface Props {
	tags?: string[] | null;
	/** 목록 카드처럼 좁은 곳에서는 앞의 몇 개만 */
	max?: number;
	className?: string;
	/** 누르면 같은 키워드의 뉴스레터 목록으로 (#20). 카드처럼 이미 링크 안에 있으면 끈다(링크 안에 링크 금지) */
	linkable?: boolean;
}

/** 뉴스레터 키워드 (#50) */
export default function Tags({ tags, max, className, linkable = false }: Props) {
	const shown = (tags ?? []).slice(0, max);
	if (!shown.length) return null;
	return (
		<StyledTags className={className} aria-label="키워드">
			{shown.map((tag) => (
				<li key={tag}>
					{linkable ? <Link href={`/articles?keyword=${encodeURIComponent(tag)}`}>#{tag}</Link> : `#${tag}`}
				</li>
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
		/* 카드의 관심사 · 제목과 다투지 않게 회색으로 한 단계 낮춤 */
		background: ${({ theme }) => theme.color.neutral};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
		white-space: nowrap;

		a {
			color: inherit;
		}

		&:has(a):hover {
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
		}
	}
`;

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
					{linkable ? (
						<Link href={`/articles?keyword=${encodeURIComponent(tag)}`}>
							<span className="hash">#</span>
							{tag}
						</Link>
					) : (
						<>
							<span className="hash">#</span>
							{tag}
						</>
					)}
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
		padding: 0.0625rem 0.5rem;
		/* 채우지 않고 얇은 테두리 + 진한 회색 글자: 관심사 · 제목(강조색)과 다투지 않으면서 또렷하게.
		   #만 강조색으로 남겨 태그라는 표시 */
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		background: transparent;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.mediumGrey};
		white-space: nowrap;

		.hash {
			margin-right: 0.0625rem;
			color: ${({ theme }) => theme.color.primary};
		}

		a {
			color: inherit;
		}

		&:has(a):hover {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
		}
	}
`;

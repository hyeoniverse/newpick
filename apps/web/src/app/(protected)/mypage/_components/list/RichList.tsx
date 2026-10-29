'use client';

import styled from 'styled-components';
import { LuNewspaper } from 'react-icons/lu';
import Image from '@/components/common/Image';

/** 목록 카드의 썸네일 (뉴스레터 첫 그림). 그림이 없으면 연한 보라 바탕에 신문 아이콘 */
export function Thumb({ src, alt }: { src: string | null | undefined; alt: string }) {
	return (
		<span className="thumb">
			{src ? (
				<Image src={src} alt={alt} ratio="wide" borderRadius="medium" priority={false} />
			) : (
				<span className="thumb-empty" aria-hidden>
					<LuNewspaper />
				</span>
			)}
		</span>
	);
}

/**
 * 마이페이지 목록 카드 (내 뉴스레터 · 북마크): 한 줄에 썸네일 · 본문(작은 머리줄 · 제목 · 요약 · 아랫줄) · 오른쪽 동작.
 * 카드마다 얇은 테두리 상자, hover 때 테두리만 보라로. 본문은 링크/단추(.main), 동작(.actions)은 그 밖에 둔다
 */
export const RichList = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 0;
	padding: 0;
	list-style: none;

	> li {
		display: flex;
		align-items: stretch;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		transition: border-color 0.15s ease;

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};

			.title {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
		padding: 1rem 0 1rem 1rem;
		text-align: left;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.thumb {
		flex-shrink: 0;
		width: 9.5rem;

		.thumb-empty {
			display: flex;
			align-items: center;
			justify-content: center;
			aspect-ratio: 16 / 9;
			border-radius: ${({ theme }) => theme.radius.surface};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.5rem;
				height: 1.5rem;
			}
		}
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	/* 머리줄: 관심사(보라) · 그 밖의 정보(회색) */
	.kicker {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};

		.cat {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

		.new {
			padding: 0.0625rem 0.375rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.primary};
			font-size: 0.625rem;
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			letter-spacing: 0.04em;
			color: #ffffff;
		}
	}

	.title {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.text};
		transition: color 0.15s ease;
	}

	.summary {
		display: -webkit-box;
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.6;
		color: ${({ theme }) => theme.color.subText};
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		margin-top: 0.125rem;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
		font-variant-numeric: tabular-nums;
	}

	.folder-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.surface};
		border: 1px solid ${({ theme }) => theme.color.border};
	}

	/* 오른쪽 동작: 위 별/북마크, 아래 폴더 */
	.actions {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 0.75rem 0.875rem 0.5rem;
	}

	.folder-menu-trigger .trigger {
		padding: 0.125rem 0.25rem;
		font: inherit;
		font-size: 0.75rem;
		color: ${({ theme }) => theme.color.subText};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			text-decoration: underline;
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.main {
			gap: 0.875rem;
			padding: 0.875rem 0 0.875rem 0.875rem;
		}

		.thumb {
			width: 5.5rem;
		}

		/* 좁은 화면: 제목을 두 줄까지 보이고 요약은 뺀다 */
		.title {
			display: -webkit-box;
			white-space: normal;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			line-height: 1.4;
		}

		.summary {
			display: none;
		}

		.actions {
			padding: 0.5rem 0.5rem 0.75rem 0.25rem;
		}
	}
`;

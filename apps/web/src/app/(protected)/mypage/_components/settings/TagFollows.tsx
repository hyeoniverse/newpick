'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { LuX } from 'react-icons/lu';
import { useTagFollows } from '@/hooks/useTagFollows';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';

/**
 * 마이페이지 > 설정의 팔로우한 태그 (#123): 맞춤 메일에서 이 태그가 나온 소식을 앞에 보내고,
 * 뉴스레터에 실리지 않은 기사 중 제목에 나온 것을 추천 기사로 챙긴다. 팔로우는 뉴스레터 목록의 태그에서
 */
export default function TagFollows() {
	const { follows, isPending, unfollow } = useTagFollows();

	return (
		<StyledTagFollows>
			<div className="head">
				<Title size="extraSmall" weight="bold" as="h2">
					팔로우한 태그
				</Title>
				<Text size="small" color="subText">
					팔로우한 태그가 나온 소식을 맞춤 메일 앞쪽에 보내드립니다. 20개까지 팔로우할 수 있습니다.
				</Text>
			</div>
			{follows.length > 0 ? (
				<ul className="tags">
					{follows.map(({ tag }) => (
						<li key={tag}>
							<Link href={`/articles?keyword=${encodeURIComponent(tag)}`}>
								<span className="hash">#</span>
								{tag}
							</Link>
							<button
								type="button"
								aria-label={`#${tag} 팔로우 끊기`}
								disabled={unfollow.isPending}
								onClick={() => unfollow.mutate(tag)}
							>
								<LuX aria-hidden />
							</button>
						</li>
					))}
				</ul>
			) : (
				!isPending && (
					<p className="empty">
						아직 팔로우한 태그가 없습니다. <Link href="/tags">태그 전체 보기</Link>나 뉴스레터의 태그를 눌러 목록 위의
						&lsquo;팔로우&rsquo;로 추가할 수 있습니다.
					</p>
				)
			)}
		</StyledTagFollows>
	);
}

const StyledTagFollows = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 4rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};
	word-break: keep-all;

	.head {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			display: inline-flex;
			align-items: center;
			gap: 0.125rem;
			margin: 0;
			padding: 0.125rem 0.25rem 0.125rem 0.625rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.tertiary};
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			color: ${({ theme }) => theme.color.primary};

			a {
				color: inherit;
				text-decoration: none;
			}

			.hash {
				margin-right: 0.0625rem;
			}

			button {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 1.5rem;
				height: 1.5rem;
				margin: 0;
				padding: 0;
				border: none;
				border-radius: 50%;
				background: transparent;
				color: inherit;
				cursor: pointer;

				&:hover:not(:disabled) {
					background: ${({ theme }) => theme.color.background};
				}

				svg {
					width: 0.875rem;
					height: 0.875rem;
				}
			}
		}
	}

	.empty {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};

		a {
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
		}
	}
`;

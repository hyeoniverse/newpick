'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTab } from '@/hooks/useTab';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import styled from 'styled-components';
import Imgae from '@/components/common/Image';
import Text from '@/components/common/Text';
import { LuChevronRight } from 'react-icons/lu';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';
import SubscribeToggle from '@/app/(protected)/mypage/_components/profile/SubscribeToggle';

/** 프로필 아래 한눈에: 받은 메일 · 북마크 · 스크랩 수를 폭 가득 세 칸으로. 누르면 그 탭으로 */
function Summary() {
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const { data: mails } = useQuery({
		queryKey: ['myMails', user?.id, 'count'],
		queryFn: () => apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.MAILS(0, 1)),
		enabled: !!user,
	});
	// 개수만 필요하니 한 개짜리 쪽으로 (목록 전체를 받지 않게)
	const { data: bookmarks } = useQuery({
		queryKey: ['bookmarks', 'count', user?.id],
		queryFn: () => apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.BOOKMARKS_PAGE('limit=1')),
		enabled: !!user,
	});
	const { data: highlights } = useQuery({
		queryKey: ['highlights', 'count', user?.id],
		queryFn: () => apiFetch<{ counts: { all: number } }>(API_ENDPOINTS.MY.HIGHLIGHTS_PAGE('limit=1')),
		enabled: !!user,
	});
	const items = [
		{ tab: 'subscriptions', label: '받은 메일', count: mails?.counts.all },
		{ tab: 'bookmarks', label: '북마크', count: bookmarks?.counts.all },
		{ tab: 'highlights', label: '스크랩', count: highlights?.counts.all },
	];
	return (
		<ul className="summary" aria-label="내 기록">
			{items.map(({ tab, label, count }) => (
				<li key={tab}>
					<button type="button" onClick={() => setActiveTab(tab)}>
						<span className="label">
							{label}
							<LuChevronRight aria-hidden />
						</span>
						<strong>{count ?? '–'}</strong>
					</button>
				</li>
			))}
		</ul>
	);
}

function Profile() {
	const { user } = useAuth();

	return (
		<ProfileStyled>
			{/* 불러오는 동안에도 자리를 잡아 둔다 (예전엔 비어 있다가 갑자기 나타났다) */}
			{!user && (
				<div className="profile">
					<span className="avatar">
						<AvatarPlaceholder loading />
					</span>
					<div className="profile-text loading" aria-hidden>
						<span className="line name" />
						<span className="line email" />
					</div>
				</div>
			)}
			{user && (
				<>
					<div className="profile">
						<span className="avatar">
							{user.profileImg ? (
								<Imgae src={user.profileImg} alt={`${user.username ?? ''} 프로필 사진`} ratio="square" />
							) : (
								<AvatarPlaceholder />
							)}
						</span>
						<div className="profile-text">
							<Text weight="semiBold">{user.username}</Text>
							{/* 이름 바로 아래, 본문 색(text)보다 한 단계 낮은 mediumGrey */}
							<Text as="p" color="mediumGrey" className="email">
								{user.email}
							</Text>
						</div>
					</div>
					<div className="subscribe">
						<SubscribeToggle />
					</div>
					<Summary />
				</>
			)}
		</ProfileStyled>
	);
}

const ProfileStyled = styled.div`
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: space-between;
	align-items: flex-start;
	width: 100%;
	gap: 2rem;

	.profile {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		justify-content: space-between;
		align-items: flex-start;

		.avatar {
			flex-shrink: 0;
			display: block;
			width: 100px;
			height: 100px;
			overflow: hidden;
			border: 1px solid ${({ theme }) => theme.color.neutral};
			border-radius: ${({ theme }) => theme.borderRadius.circle};

			img {
				width: 100%;
				height: 100%;
			}
		}

		/* 불러오는 중: 이름·이메일 자리 */
		.profile-text.loading {
			display: flex;
			flex-direction: column;
			gap: 0.625rem;
			padding-top: 0.25rem;

			.line {
				display: block;
				height: 1rem;
				border-radius: ${({ theme }) => theme.borderRadius.soft};
				background: color-mix(in srgb, ${({ theme }) => theme.color.text} 7%, ${({ theme }) => theme.color.background});
			}

			.name {
				width: 5rem;
			}

			.email {
				width: 11rem;
			}
		}

		.profile-text {
			/* 긴 메일 주소가 좁은 화면(360px) 밖으로 나가 페이지가 옆으로 밀리지 않게 (#17) */
			min-width: 0;
			align-self: center;

			> :first-child {
				font-size: ${({ theme }) => theme.fontSize.large};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
			}

			p {
				padding: 0.25rem 0;
				overflow-wrap: anywhere;
			}
		}
	}

	/* 받은 메일 · 북마크 · 스크랩 수: 프로필 아래 폭 가득 세 칸 (연한 바탕 · 위아래 줄, 내 뉴스레터의 달 막대와 같은 결).
	   칸마다 이름 › 위, 큰 숫자 아래. 누르면 그 탭으로 */
	.summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};

		li + li {
			border-left: 1px solid ${({ theme }) => theme.color.border};
		}

		button {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.375rem;
			width: 100%;
			padding: 1rem 1.25rem;
			cursor: pointer;
			transition: background-color 0.2s ease;

			.label {
				display: inline-flex;
				align-items: center;
				gap: 0.125rem;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
				color: ${({ theme }) => theme.color.mediumGrey};

				svg {
					width: 0.875rem;
					height: 0.875rem;
					color: ${({ theme }) => theme.color.subText};
					transition: transform 0.2s ease;
				}
			}

			strong {
				font-size: ${({ theme }) => theme.fontSize.extraLarge};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				line-height: 1;
				color: ${({ theme }) => theme.color.text};
				font-variant-numeric: tabular-nums;
				transition: color 0.2s ease;
			}

			&:hover {
				background: ${({ theme }) => theme.color.tertiary};

				.label svg {
					transform: translateX(2px);
					color: ${({ theme }) => theme.color.primary};
				}

				strong {
					color: ${({ theme }) => theme.color.primary};
				}
			}
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		gap: 1.5rem;

		.profile {
			gap: 1.25rem;

			.avatar {
				width: 72px;
				height: 72px;
			}
		}

		.subscribe {
			width: 100%;
		}

		.summary button {
			padding: 0.875rem 0.75rem;

			strong {
				font-size: ${({ theme }) => theme.fontSize.large};
			}
		}
	}
`;

export default Profile;

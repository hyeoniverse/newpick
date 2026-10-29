'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTab } from '@/hooks/useTab';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import styled from 'styled-components';
import Imgae from '@/components/common/Image';
import Text from '@/components/common/Text';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';
import SubscribeToggle from '@/app/(protected)/mypage/_components/profile/SubscribeToggle';
import { LuBookmark, LuChevronRight, LuHighlighter, LuMail } from 'react-icons/lu';

/**
 * 프로필 아래 한눈에: 받은 메일 · 북마크 · 스크랩을 타일 세 칸으로 (아이콘 · 이름 · 수 · ›). 누르면 그 탭으로,
 * 지금 보는 탭의 타일은 보라 테두리
 */
function Summary() {
	const { user } = useAuth();
	const { activeTab, setActiveTab } = useTab();
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
		{ tab: 'subscriptions', label: '받은 메일', unit: '통', icon: LuMail, count: mails?.counts.all },
		{ tab: 'bookmarks', label: '북마크', unit: '개', icon: LuBookmark, count: bookmarks?.counts.all },
		{ tab: 'highlights', label: '스크랩', unit: '개', icon: LuHighlighter, count: highlights?.counts.all },
	];
	return (
		<ul className="summary" aria-label="내 기록">
			{items.map(({ tab, label, unit, icon: Icon, count }) => (
				<li key={tab}>
					<button
						type="button"
						className={activeTab === tab ? 'current' : undefined}
						aria-current={activeTab === tab || undefined}
						onClick={() => setActiveTab(tab)}
					>
						<span className="icon" aria-hidden>
							<Icon />
						</span>
						<span className="text">
							<span className="label">{label}</span>
							<span className="count">
								<strong>{count === undefined ? '–' : count.toLocaleString()}</strong>
								{unit}
							</span>
						</span>
						<LuChevronRight className="go" aria-hidden />
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
							<Text as="p" color="subText">
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

			p {
				padding: 0.25rem 0;
				overflow-wrap: anywhere;
			}
		}
	}

	/* 받은 메일 · 북마크 · 스크랩 수: 숫자 위, 이름 아래. 사이는 얇은 세로줄 */
	/* 기록 타일 세 칸: 프로필 아래 한 줄 전체. 얇은 테두리 · 8px, 고르면(지금 탭) 보라 테두리 */
	.summary {
		flex-basis: 100%;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;

		button {
			display: flex;
			align-items: center;
			gap: 0.875rem;
			width: 100%;
			padding: 1rem 1.125rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.surface};
			background: ${({ theme }) => theme.color.background};
			text-align: left;
			cursor: pointer;
			transition: border-color 0.15s ease;

			&:hover,
			&.current {
				border-color: ${({ theme }) => theme.color.primary};
			}

			&:hover .go,
			&.current .go {
				color: ${({ theme }) => theme.color.primary};
			}
		}

		.icon {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2.5rem;
			height: 2.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.125rem;
				height: 1.125rem;
			}
		}

		.text {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 0.125rem;
		}

		.label {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
			white-space: nowrap;
		}

		.count {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};

			strong {
				margin-right: 0.125rem;
				font-size: ${({ theme }) => theme.fontSize.medium};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				color: ${({ theme }) => theme.color.text};
				font-variant-numeric: tabular-nums;
			}
		}

		.go {
			flex-shrink: 0;
			width: 1rem;
			height: 1rem;
			color: ${({ theme }) => theme.color.disabled};
			transition: color 0.15s ease;
		}
	}

	/* 좁은 화면(640px 이하): 한 칸이 좁아 가로로 놓으면 이름이 세로로 꺾이므로 아이콘 위, 이름 · 수 아래 가운데, 화살표는 뺀다 */
	@media (max-width: 640px) {
		.summary {
			gap: 0.5rem;

			button {
				flex-direction: column;
				gap: 0.5rem;
				padding: 0.875rem 0.5rem;
				text-align: center;
			}

			.text {
				align-items: center;
			}

			.go {
				display: none;
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
	}
`;

export default Profile;

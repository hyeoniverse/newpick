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

/** 기록 셋 (인스타그램의 게시물 · 팔로워 · 팔로잉처럼): 굵은 숫자 + 이름. 누르면 그 탭으로 */
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
						<strong>{count === undefined ? '–' : count.toLocaleString()}</strong>
						<span>{label}</span>
					</button>
				</li>
			))}
		</ul>
	);
}

/**
 * 마이페이지 프로필 (인스타그램 프로필처럼): 왼쪽 큰 동그란 사진, 오른쪽에 이름 · 구독 단추 / 기록 셋 / 이메일.
 * 휴대폰은 사진 옆에 기록 셋, 그 아래 이름 · 이메일 · 구독 단추(한 줄 꽉)
 */
function Profile() {
	const { user } = useAuth();

	return (
		<ProfileStyled aria-busy={!user || undefined}>
			<span className="avatar">
				{user?.profileImg ? (
					<Imgae src={user.profileImg} alt={`${user.username ?? ''} 프로필 사진`} ratio="square" />
				) : (
					<AvatarPlaceholder loading={!user} />
				)}
			</span>
			{/* 불러오는 동안에도 자리를 잡아 둔다 (예전엔 비어 있다가 갑자기 나타났다) */}
			{!user && (
				<div className="loading" aria-hidden>
					<span className="line name" />
					<span className="line email" />
				</div>
			)}
			{user && (
				<>
					<Text weight="semiBold" className="name">
						{user.username}
					</Text>
					<div className="subscribe">
						<SubscribeToggle />
					</div>
					<Summary />
					<Text as="p" color="subText" className="email">
						{user.email}
					</Text>
				</>
			)}
		</ProfileStyled>
	);
}

const ProfileStyled = styled.div`
	display: grid;
	grid-template-columns: 9.5rem auto minmax(0, 1fr);
	grid-template-areas:
		'avatar name subscribe'
		'avatar stats stats'
		'avatar email email';
	align-items: center;
	column-gap: 1.25rem;
	row-gap: 1rem;
	width: 100%;
	padding-left: 1rem;

	.avatar {
		grid-area: avatar;
		align-self: start;
		display: block;
		width: 7.5rem;
		height: 7.5rem;
		overflow: hidden;
		border: 1px solid ${({ theme }) => theme.color.neutral};
		border-radius: ${({ theme }) => theme.borderRadius.circle};

		img {
			width: 100%;
			height: 100%;
		}
	}

	.name {
		grid-area: name;
		font-size: ${({ theme }) => theme.fontSize.large};
	}

	/* 구독 단추: 인스타그램의 '프로필 편집'처럼 이름 옆 작은 단추로 */
	.subscribe {
		grid-area: subscribe;
		justify-self: start;

		.subscribe-on,
		.subscribe-off,
		.not-subscribe {
			width: auto;
			height: 2.25rem;
			padding: 0 0.875rem;
			gap: 0.5rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};

			.svg {
				width: 2rem;
				height: 1.25rem;
			}
		}
	}

	.email {
		grid-area: email;
		/* 긴 메일 주소가 좁은 화면(360px) 밖으로 나가 페이지가 옆으로 밀리지 않게 (#17) */
		min-width: 0;
		overflow-wrap: anywhere;
	}

	/* 불러오는 중: 이름 · 이메일 자리 */
	.loading {
		grid-area: name / name / email / subscribe;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;

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

	/* 기록 셋: '1 받은 메일   8 북마크   5 스크랩' — 숫자 굵게, 이름 보통. 누르면 그 탭 (hover 때 보라) */
	.summary {
		grid-area: stats;
		display: flex;
		gap: 2.5rem;
		margin: 0;
		padding: 0;
		list-style: none;

		button {
			display: inline-flex;
			align-items: baseline;
			gap: 0.375rem;
			padding: 0;
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};
			cursor: pointer;

			strong {
				font-weight: ${({ theme }) => theme.fontWeight.bold};
				font-variant-numeric: tabular-nums;
			}

			&:hover,
			&:hover strong {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	/* 휴대폰: 사진 옆에 기록 셋(숫자 위 · 이름 아래, 가운데), 그 아래 이름 · 이메일 · 구독 단추 한 줄 꽉 */
	@media ${({ theme }) => theme.mediaQuery.tablet} {
		grid-template-columns: 5.5rem minmax(0, 1fr);
		grid-template-areas:
			'avatar stats'
			'name name'
			'email email'
			'subscribe subscribe';
		row-gap: 0.25rem;
		padding-left: 0;

		.avatar {
			align-self: center;
			width: 5.5rem;
			height: 5.5rem;
		}

		.name {
			margin-top: 0.75rem;
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		.email {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}

		.summary {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0;

			button {
				flex-direction: column;
				align-items: center;
				gap: 0.125rem;
				width: 100%;
				font-size: ${({ theme }) => theme.fontSize.extraSmall};

				strong {
					font-size: ${({ theme }) => theme.fontSize.medium};
				}
			}
		}

		.subscribe {
			justify-self: stretch;
			margin-top: 0.75rem;

			.subscribe-on,
			.subscribe-off,
			.not-subscribe {
				width: 100%;
				justify-content: center;
			}
		}
	}
`;

export default Profile;

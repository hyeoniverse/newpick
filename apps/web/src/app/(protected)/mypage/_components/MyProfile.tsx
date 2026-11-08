'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTab } from '@/hooks/useTab';
import { apiFetch } from '@/api/client';
import API_ENDPOINTS from '@/constants/api';
import Imgae from '@/components/common/Image';
import Text from '@/components/common/Text';
import { LuChevronRight } from 'react-icons/lu';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';
import SubscribeToggle from '@/app/(protected)/mypage/_components/profile/SubscribeToggle';
import { cx } from '@/styles/tw';

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

const ProfileStyled = ({ className, ...props }: React.ComponentProps<'div'>) => (
	<div className={cx('np-mypage-my-profile-profile', className)} {...props} />
);

export default Profile;

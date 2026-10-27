'use client';

import { useAuth } from '@/hooks/useAuth';
import styled from 'styled-components';
import Imgae from '@/components/common/Image';
import Text from '@/components/common/Text';
import AvatarPlaceholder from '@/components/common/AvatarPlaceholder';
import SubscribeToggle from '@/app/(protected)/mypage/_components/profile/SubscribeToggle';

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

			ul {
				display: flex;
				flex-wrap: wrap;
				flex-direction: row;
				gap: 0.125rem 0.875rem;
				color: ${({ theme }) => theme.color.subText};
				font-size: ${({ theme }) => theme.fontSize.extraSmall};
			}
		}
	}
`;

export default Profile;

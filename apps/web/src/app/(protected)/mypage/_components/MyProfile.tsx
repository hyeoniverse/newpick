'use client';

import { User as IUser } from '@/models/user.model';
import styled from 'styled-components';
import Image from '@/components/common/Image';
import Text from '@/components/common/Text';
import SubscribeToggle from '@/app/(protected)/mypage/_components/profile/SubscribeToggle';

interface Props {
	user: IUser;
}

function Profile({ user }: Props) {
	return (
		<ProfileStyled>
			{user && (
				<>
					<div className="profile">
						<Image src={user.profileImg || '/img/profile.jpg'} alt="prifile-img" ratio="square" />
						<div className="profile-text">
							<Text weight="semiBold">{user.username}</Text>
							<Text as="p" color="subText">
								{user.email}
							</Text>
						</div>
					</div>
					<div className="subscribe">
						<SubscribeToggle user={user} />
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

		img {
			height: 100px;
			width: 100px;
			border: 1px solid ${({ theme }) => theme.color.neutral};
			border-radius: ${({ theme }) => theme.borderRadius.circle};
		}

		.profile-text {
			p {
				padding: 0.25rem 0;
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

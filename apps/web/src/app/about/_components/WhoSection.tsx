'use client';

import { TEAMS } from '@/constants/about';
import { styled } from 'styled-components';
import { LuExternalLink } from 'react-icons/lu';
import Text from '@/components/common/Text';
import Image from '@/components/common/Image';
import BorderTitle from '@/components/common/BorderTitle';
import FullWidthPanel from '@/components/common/FullWidthPanel';

export default function WhoSection() {
	return (
		<StyledWhoSection>
			<FullWidthPanel background="mono" className="panel">
				<div className="content">
					<BorderTitle text="WHO WE ARE" color="white" className="title" />
				</div>
				<div className="content">
					<Text size="medium" color="white">
						함께 뉴픽을 만든 팀원을 소개합니다.
					</Text>
					<Container>
						{TEAMS.map((team) => (
							<TeamWrapper key={team.role}>
								<TeamHeader color={team.color}>{team.role}</TeamHeader>
								<MemberList>
									{team.members.map((member) => (
										<MemberCard key={member.name}>
											<ProfileImage href={member.link} target="_blank" rel="noopener noreferrer">
												<Image ratio="square" src={member.image} alt={member.name} />
												<Overlay>
													Github <LuExternalLink />
												</Overlay>
											</ProfileImage>

											<MemberInfo>
												<Name>{member.name}</Name>
												<Position>
													{member.isLeader && <LeaderTag>팀장</LeaderTag>}
													{member.position}
												</Position>
											</MemberInfo>
										</MemberCard>
									))}
								</MemberList>
							</TeamWrapper>
						))}
					</Container>
				</div>
			</FullWidthPanel>
		</StyledWhoSection>
	);
}

const StyledWhoSection = styled.div`
	margin-top: auto;

	.panel {
		padding: 6rem 0;
		display: flex;
		flex-direction: column;
		margin: 0;

		.content {
			width: 100%;
			height: 100%;
			max-width: ${({ theme }) => theme.layout.width.large};
			padding: 0 1rem;

			.title {
				margin-bottom: 0.5rem;
			}
		}
	}
`;

const Container = styled.div`
	display: flex;
	justify-content: space-between;
	margin-top: 2rem;
	background-color: ${({ theme }) => theme.color.mono};
	color: ${({ theme }) => theme.color.background};
`;

const TeamWrapper = styled.div`
	width: calc(50% - 1.5rem);
`;

const TeamHeader = styled.div`
	background-color: ${(props) => props.color};
	padding: 0.5rem;
	text-align: center;
	font-weight: ${({ theme }) => theme.fontWeight.bold};
	border-radius: ${({ theme }) => theme.borderRadius.capsule};
`;

const MemberList = styled.div`
	margin-top: 1rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const MemberCard = styled.div`
	display: flex;
	align-items: flex-start;
	padding: 0.5rem;
	gap: 0.5rem;
`;

const ProfileImage = styled.a`
	position: relative;
	width: 8rem;
	height: 8rem;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: ${({ theme }) => theme.fontSize.medium};
	background: ${({ theme }) => theme.color.neutral};
	color: ${({ theme }) => theme.color.text};
	font-weight: ${({ theme }) => theme.fontWeight.bold};
	border-radius: ${({ theme }) => theme.borderRadius.medium};
	overflow: hidden;
`;

const Overlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.3);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.3s ease;

	${ProfileImage}:hover & {
		opacity: 1;
	}
`;

const MemberInfo = styled.div`
	margin-left: 1rem;
`;

const Name = styled.div`
	font-size: ${({ theme }) => theme.fontSize.small};
	font-weight: bold;
	margin-bottom: 0.25rem;
`;

const Position = styled.div`
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	color: ${({ theme }) => theme.color.surface};
`;

const LeaderTag = styled.span`
	background: #ffe100;
	color: black;
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	font-weight: bold;
	padding: 0.2rem 0.5rem;
	margin-right: 0.5rem;
	border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

'use client';

import { TEAMS } from '@/constants/about';
import { styled } from 'styled-components';
import { LuExternalLink } from 'react-icons/lu';
import Image from '@/components/common/Image';
import BorderTitle from '@/components/common/BorderTitle';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import ExternalLink from '@/components/common/ExternalLink';

/**
 * 팀 소개. 띠는 라이트·다크 모두 어두운 바탕이라 글자색을 테마 글자색이 아닌 밝은 색으로 고정한다
 * (전에는 테마 바탕색을 글자에 써서 다크 모드에서 이름이 보이지 않았다)
 */
export default function WhoSection() {
	return (
		<StyledWhoSection>
			<FullWidthPanel background="mono" className="panel">
				<div className="content">
					<BorderTitle text="WHO WE ARE" color="white" className="title" />
					<p className="lead">함께 뉴픽을 만든 팀원을 소개합니다.</p>

					<div className="teams">
						{TEAMS.map((team) => (
							<section key={team.role} className="team" aria-label={team.role}>
								<h3 className="team-name">
									<span className="dot" style={{ background: team.color }} aria-hidden />
									{team.role}
									<span className="count">{team.members.length}명</span>
								</h3>
								<ul className="members">
									{team.members.map((member) => (
										<li key={member.name} className="member">
											<ExternalLink
												href={member.link}
												showIcon={false}
												className="photo"
												aria-label={`${member.name} GitHub`}
											>
												<Image ratio="square" src={member.image} alt="" />
												<span className="overlay" aria-hidden>
													GitHub <LuExternalLink />
												</span>
											</ExternalLink>
											<p className="name">{member.name}</p>
											<p className="position">
												{member.isLeader && <span className="leader">팀장</span>}
												<span className="role">{member.position}</span>
											</p>
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				</div>
			</FullWidthPanel>
		</StyledWhoSection>
	);
}

const StyledWhoSection = styled.div`
	margin-top: auto;

	.panel {
		padding: 6rem 0;
		margin: 0;
		color: #f1f1f1;

		/* 다크 모드는 페이지 바탕도 어두워 띠가 묻힌다. 조금 밝게 띄우고 위아래 선으로 나눈다 */
		:root[data-theme='dark'] & {
			background: color-mix(in srgb, ${({ theme }) => theme.color.text} 5%, ${({ theme }) => theme.color.background});
			border-top: 1px solid ${({ theme }) => theme.color.border};
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			padding: 4rem 0;
		}
	}

	/* 다른 섹션과 왼쪽 끝을 맞춘다 */
	.content {
		width: 100%;
		max-width: ${({ theme }) => theme.layout.width.large};

		@media ${({ theme }) => theme.mediaQuery.desktop} {
			padding: 0 1rem;
		}
	}

	.title {
		margin-bottom: 1rem;
	}

	.lead {
		margin: 0 0 3rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		color: #c1c1c1;
	}

	.teams {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	/* 팀 이름은 왼쪽 칸, 팀원은 오른쪽 격자. 좁은 화면은 위아래로 */
	.team {
		display: grid;
		grid-template-columns: 10rem 1fr;
		gap: 1.5rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}

	.team-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding-top: 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		font-weight: ${({ theme }) => theme.fontWeight.bold};

		.dot {
			width: 0.625rem;
			height: 0.625rem;
			flex-shrink: 0;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
		}

		.count {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			color: #999999;
		}
	}

	.members {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem 0.75rem;
		}
	}

	.member {
		min-width: 0;
	}

	.photo {
		position: relative;
		display: block;
		overflow: hidden;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: #2d2d2d;

		img {
			transition: transform 0.4s ease;
		}

		.overlay {
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: #ffffff;
			background: rgba(0, 0, 0, 0.45);
			opacity: 0;
			transition: opacity 0.25s ease;
		}

		&:hover,
		&:focus-visible {
			img {
				transform: scale(1.05);
			}

			.overlay {
				opacity: 1;
			}
		}

		&:focus-visible {
			outline: 2px solid #ffffff;
			outline-offset: 2px;
		}

		@media (prefers-reduced-motion: reduce) {
			img,
			.overlay {
				transition: none;
			}

			&:hover img,
			&:focus-visible img {
				transform: none;
			}
		}
	}

	.name {
		margin: 0.75rem 0 0.25rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* 팀장 배지와 역할은 늘 한 줄. 좁으면 역할 글자만 말줄임 */
	.position {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		min-width: 0;
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: #c1c1c1;
		white-space: nowrap;

		.role {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.leader {
		flex-shrink: 0;
		padding: 0.0625rem 0.5rem;
		border-radius: ${({ theme }) => theme.radius.chip};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: #121212;
		background: #f1f1f1;
		white-space: nowrap;
	}
`;

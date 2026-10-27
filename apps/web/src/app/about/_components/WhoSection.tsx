'use client';

import { TEAMS, V1, V2 } from '@/constants/about';
import { styled } from 'styled-components';
import { LuChevronDown, LuExternalLink } from 'react-icons/lu';
import Image from '@/components/common/Image';
import BorderTitle from '@/components/common/BorderTitle';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import ExternalLink from '@/components/common/ExternalLink';

interface Member {
	name: string;
	position: string;
	detail?: string;
	isLeader?: boolean;
	link: string;
	image: string;
}

/** v2는 사진 아래 이름(photo), v1은 맡은 일이 길어 사진 옆에 이름·맡은 일(row) */
function MemberCard({
	name,
	position,
	detail,
	isLeader,
	link,
	image,
	variant = 'photo',
}: Member & { variant?: 'photo' | 'row' }) {
	return (
		<div className={`member ${variant}`}>
			<ExternalLink href={link} showIcon={false} className="photo" aria-label={`${name} GitHub`}>
				<Image ratio="square" src={image} alt="" />
				<span className="overlay" aria-hidden>
					GitHub <LuExternalLink />
				</span>
			</ExternalLink>
			<div className="info">
				<p className="name">{name}</p>
				<p className="position">
					{isLeader && <span className="leader">팀장</span>}
					<span className="role">{position}</span>
				</p>
			</div>
			{/* 맡은 일은 ' · '로 나눠 한 줄에 하나씩 (좁은 칸에서 단어가 중간에 끊기지 않게) */}
			{detail && (
				<ul className="detail">
					{detail.split(' · ').map((item) => (
						<li key={item}>{item}</li>
					))}
				</ul>
			)}
		</div>
	);
}

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
					<p className="lead">뉴픽을 만든 사람들을 소개합니다.</p>

					{/* v2: 팀 프로젝트를 이어 혼자 다시 만든 지금의 뉴픽 */}
					<section className="version" aria-label="v2">
						<p className="version-head">
							<span className="version-chip">v2</span>
							<span className="period">{V2.period}</span>
							<span className="label">{V2.label}</span>
						</p>
						<div className="v2">
							<MemberCard {...V2.member} />
							<div className="works">
								{V2.works.map(({ area, items }) => (
									<section key={area} className="work" aria-label={area}>
										<h3 className="work-area">{area}</h3>
										<ul>
											{items.map((item) => (
												<li key={item}>{item}</li>
											))}
										</ul>
									</section>
								))}
							</div>
						</div>
					</section>

					{/* v1: 지난 팀 프로젝트. 기본은 접어 두고 눌러서 펼친다 */}
					<details className="version">
						<summary className="version-head">
							<span className="version-chip">v1</span>
							<span className="period">{V1.period}</span>
							<span className="label">
								{V1.label} · {TEAMS.reduce((sum, team) => sum + team.members.length, 0)}명
							</span>
							<span className="toggle">
								<span className="toggle-text" aria-hidden />
								<LuChevronDown aria-hidden />
							</span>
						</summary>
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
											<li key={member.name}>
												<MemberCard {...member} variant="row" />
											</li>
										))}
									</ul>
								</section>
							))}
						</div>
					</details>
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
		margin: 0 0 2.5rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
		color: #c1c1c1;
	}

	.version + .version {
		margin-top: 4rem;
		padding-top: 3rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
	}

	.version-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		margin: 0 0 2rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: #c1c1c1;

		.version-chip {
			padding: 0.125rem 0.625rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: #121212;
			background: #f1f1f1;
		}

		.period {
			font-variant-numeric: tabular-nums;
			color: #f1f1f1;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
		}
	}

	/* 접는 v1: 머리 줄 전체가 버튼. 펼치면 화살표가 돌고 글자가 바뀐다 */
	details.version {
		summary {
			margin: 0;
			cursor: pointer;
			list-style: none;
			border-radius: ${({ theme }) => theme.radius.chip};

			&::-webkit-details-marker {
				display: none;
			}

			&:hover .toggle {
				color: #ffffff;
			}

			&:focus-visible {
				outline: 2px solid #ffffff;
				outline-offset: 4px;
			}
		}

		.toggle {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			margin-left: auto;
			color: #c1c1c1;
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			white-space: nowrap;

			.toggle-text::before {
				content: '펼쳐 보기';
			}

			svg {
				transition: transform 0.25s ease;
			}
		}

		&[open] {
			summary {
				margin-bottom: 2rem;
			}

			.toggle-text::before {
				content: '접기';
			}

			.toggle svg {
				transform: rotate(180deg);
			}
		}

		@media (prefers-reduced-motion: reduce) {
			.toggle svg {
				transition: none;
			}
		}
	}

	/* v2: 사진 한 장 + 영역별 한 일. 모바일은 사진 위, 목록 아래 */
	.v2 {
		display: grid;
		grid-template-columns: 10rem 1fr;
		gap: 2rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 1fr;
			gap: 1.5rem;

			.member {
				display: grid;
				grid-template-columns: 5rem 1fr;
				column-gap: 1rem;
				align-items: center;

				.name {
					margin: 0 0 0.25rem;
				}
			}
		}
	}

	.works {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 2rem 2.5rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}

	.work-area {
		margin: 0 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: #9ca9ff;
	}

	.work ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.6;
		word-break: keep-all;

		li {
			position: relative;
			padding-left: 1rem;

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 0.7em;
				width: 0.375rem;
				height: 0.375rem;
				border-radius: ${({ theme }) => theme.borderRadius.circle};
				background: #9ca9ff;
			}
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
		}
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

	/* v1 팀원: 사진을 크게 왼쪽에, 이름·역할·맡은 일을 오른쪽에 (v2와 같은 사진 중심). 넓으면 두 명씩, 모바일은 한 명씩 */
	.members {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
		gap: 2.5rem 2rem;
		margin: 0;
		padding: 0;
		list-style: none;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	.member {
		min-width: 0;
	}

	.member.row {
		display: grid;
		grid-template-columns: 9rem minmax(0, 1fr);
		column-gap: 1.25rem;
		align-items: start;

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			grid-template-columns: 7rem minmax(0, 1fr);
			column-gap: 1rem;
		}

		.photo {
			grid-row: span 2;
		}

		.name {
			margin: 0 0 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.medium};
		}

		.detail {
			margin-top: 0.75rem;
			gap: 0.25rem;

			li {
				position: relative;
				padding-left: 0.75rem;

				&::before {
					content: '';
					position: absolute;
					left: 0;
					top: 0.7em;
					width: 0.25rem;
					height: 0.25rem;
					border-radius: 50%;
					background: #9ca9ff;
				}
			}
		}
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

	.detail {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin: 0.375rem 0 0;
		padding: 0;
		list-style: none;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.5;
		color: #999999;
		word-break: keep-all;
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

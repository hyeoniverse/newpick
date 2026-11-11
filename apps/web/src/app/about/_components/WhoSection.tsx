'use client';

import { TEAMS, V1, V2 } from '@/content/about';
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
		<div className="np-about-who-section-who-section" data-track-section="about-who">
			<FullWidthPanel background="mono" className="panel">
				<div className="content">
					<BorderTitle text="WHO WE ARE" color="white" className="title" />
					<p className="lead">뉴픽을 만든 사람들을 소개해요.</p>

					{/* v2: 팀 프로젝트를 이어 혼자 다시 만든 지금의 뉴픽 */}
					<section className="version" aria-label="v2">
						<p className="version-head">
							<span className="version-chip">v2</span>
							<span className="period">{V2.period}</span>
							<span className="label">{V2.label}</span>
						</p>
						<div className="v2">
							<MemberCard {...V2.member} variant="row" />
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
		</div>
	);
}

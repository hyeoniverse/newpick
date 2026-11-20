'use client';

import Link from 'next/link';
import type { IconType } from 'react-icons';
import {
	LuArrowUpRight,
	LuCheck,
	LuCloud,
	LuCookie,
	LuFilter,
	LuGauge,
	LuKeyRound,
	LuLock,
	LuMonitorSmartphone,
	LuServer,
	LuShieldCheck,
	LuTrash2,
	LuUserCheck,
	LuLockKeyhole,
} from 'react-icons/lu';
import { ABOUT } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { GITHUB } from '@/content/about';
import ExternalLink from '@/components/common/ExternalLink';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

const GATE_ICONS: Record<(typeof ABOUT.security.gates)[number]['icon'], IconType> = {
	cloud: LuCloud,
	user: LuUserCheck,
	shield: LuShieldCheck,
	gauge: LuGauge,
	filter: LuFilter,
};

const CARD_ICONS: Record<(typeof ABOUT.security.items)[number]['icon'], IconType> = {
	key: LuKeyRound,
	cookie: LuCookie,
	devices: LuMonitorSmartphone,
	lock: LuLock,
	server: LuServer,
	trash: LuTrash2,
};

/** 자세한 보안 설계 문서 (저장소의 docs/security.md) */
export const SECURITY_DOC = `${GITHUB.REPO}/blob/main/docs/security.md`;

/**
 * 요청 하나가 내 정보에 닿기까지: 관문 다섯 개와 맨 끝의 '내 정보'.
 * 읽는 동안(read) 스크롤하면 요청 점이 길을 따라 움직이고, 지나간 관문이 차례로 켜진다 (--progress × 단계 수 - 순서).
 * 움직임 줄이기를 켠 사용자에게는 처음부터 모두 켜 둔다 (CSS)
 */
function RequestPath() {
	const ref = useScrollProgress<HTMLOListElement>('read');
	const { gates, vault } = ABOUT.security;
	const steps = gates.length + 1;
	return (
		<ol ref={ref} className="path" style={{ '--steps': steps } as React.CSSProperties}>
			<span className="rail" aria-hidden>
				<span className="fill" />
				<span className="packet" />
			</span>
			{gates.map(({ icon, name, text }, i) => {
				const Icon = GATE_ICONS[icon];
				return (
					<li key={name} className="gate" style={{ '--i': i } as React.CSSProperties}>
						<span className="node" aria-hidden>
							<Icon className="glyph" />
							<LuCheck className="tick" />
						</span>
						<span className="name">{name}</span>
						<span className="text">{text}</span>
					</li>
				);
			})}
			<li className="gate vault" style={{ '--i': gates.length } as React.CSSProperties}>
				<span className="node" aria-hidden>
					<LuLockKeyhole className="glyph" />
					<LuCheck className="tick" />
				</span>
				<span className="name">{vault.name}</span>
				<span className="text">{vault.text}</span>
			</li>
		</ol>
	);
}

/**
 * 시작하기 '내 정보, 이렇게 지킵니다': 화면 폭 전체의 어두운 띠 위에, 요청이 지나는 길(관문) → 약속 여섯 가지 → 문서 링크.
 * 문구는 실제 코드 · 배포 기준(README '보안' · docs/security.md를 이용자 말로)이고 copy/marketing.ts에 둔다
 */
export default function SecuritySection() {
	const { title, sub, pathTitle, items, privacy, detail } = ABOUT.security;
	return (
		<section id="about-security" className="np-about-security-section-security" data-track-section="about-security">
			<div className="inner">
				<SectionHeading label="SECURITY" title={title} sub={sub} />
				<p className="path-title">{pathTitle}</p>
				<RequestPath />
				<ul className="cards">
					{items.map(({ icon, title: cardTitle, text }, i) => {
						const Icon = CARD_ICONS[icon];
						return (
							<li key={cardTitle} className="card">
								<span className="head">
									<span className="no">{String(i + 1).padStart(2, '0')}</span>
									<Icon className="icon" aria-hidden />
								</span>
								<h3 className="title">{cardTitle}</h3>
								<p className="text">{text}</p>
							</li>
						);
					})}
				</ul>
				<p className="links">
					<ExternalLink href={SECURITY_DOC} showIcon={false} className="link primary">
						{detail}
						<LuArrowUpRight aria-hidden />
					</ExternalLink>
					<Link href={ROUTES.privacy} className="link">
						{privacy}
						<LuArrowUpRight aria-hidden />
					</Link>
				</p>
			</div>
		</section>
	);
}

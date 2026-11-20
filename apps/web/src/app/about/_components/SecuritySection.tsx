import Link from 'next/link';
import type { IconType } from 'react-icons';
import { LuArrowUpRight, LuCookie, LuKeyRound, LuLock, LuMonitorSmartphone, LuServer, LuTrash2 } from 'react-icons/lu';
import { ABOUT } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { GITHUB } from '@/content/about';
import ExternalLink from '@/components/common/ExternalLink';
import SectionHeading from '@/app/about/_components/SectionHeading';

const ICONS: Record<(typeof ABOUT.security.items)[number]['icon'], IconType> = {
	key: LuKeyRound,
	cookie: LuCookie,
	devices: LuMonitorSmartphone,
	lock: LuLock,
	server: LuServer,
	trash: LuTrash2,
};

/**
 * 시작하기 '내 정보, 이렇게 지킵니다': 로그인 · 세션 · 기기 · 권한 · 서버 · 개인정보를 카드 여섯 장으로.
 * 문구는 실제 코드 · 배포 기준이고(README '보안'과 같은 내용을 이용자 말로), copy/marketing.ts에 둔다.
 * 아래에 처리방침과 자세한 보안 설계(README) 링크
 */
export default function SecuritySection() {
	const { title, sub, items, privacy, detail } = ABOUT.security;
	return (
		<section id="about-security" className="np-about-security-section-security" data-track-section="about-security">
			<SectionHeading label="SECURITY" title={title} sub={sub} />
			<ul className="cards">
				{items.map(({ icon, title: cardTitle, text }) => {
					const Icon = ICONS[icon];
					return (
						<li key={cardTitle} className="card">
							<span className="icon" aria-hidden>
								<Icon />
							</span>
							<h3 className="title">{cardTitle}</h3>
							<p className="text">{text}</p>
						</li>
					);
				})}
			</ul>
			<p className="links">
				<Link href={ROUTES.privacy} className="link">
					{privacy}
					<LuArrowUpRight aria-hidden />
				</Link>
				<ExternalLink href={`${GITHUB.REPO}#보안`} showIcon={false} className="link">
					{detail}
					<LuArrowUpRight aria-hidden />
				</ExternalLink>
			</p>
		</section>
	);
}

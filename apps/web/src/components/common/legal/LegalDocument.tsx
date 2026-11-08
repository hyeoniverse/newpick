'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExternalLink from '@/components/common/ExternalLink';
import {
	LuBadgeCheck,
	LuClock,
	LuDatabase,
	LuGlobe,
	LuMail,
	LuMessageCircle,
	LuShare2,
	LuSparkles,
	LuTarget,
} from 'react-icons/lu';

/** 문단: 글자, 목록, 표 */
export type LegalBlock = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };
export type LegalSection = { title: string; blocks: LegalBlock[] };

/** 한눈에 보기 카드 (개인정보 처리방침 작성지침의 "주요 처리 사항" 요약) */
export type LegalSummary = {
	icon: 'collect' | 'purpose' | 'period' | 'share' | 'global' | 'contact' | 'free' | 'ai' | 'mail';
	title: string;
	text: string;
};

const ICONS: Record<LegalSummary['icon'], React.ReactNode> = {
	collect: <LuDatabase />,
	purpose: <LuTarget />,
	period: <LuClock />,
	share: <LuShare2 />,
	global: <LuGlobe />,
	contact: <LuMessageCircle />,
	free: <LuBadgeCheck />,
	ai: <LuSparkles />,
	mail: <LuMail />,
};

const DOCS = [
	{ key: 'terms', title: '이용약관', href: '/terms' },
	{ key: 'privacy', title: '개인정보 처리방침', href: '/privacy' },
] as const;

interface Props {
	doc: (typeof DOCS)[number]['key'];
	title: string;
	/** 시행일 'YYYY년 M월 D일' */
	effectiveDate: string;
	intro: string;
	summary?: LegalSummary[];
	sections: LegalSection[];
}

const sectionId = (i: number) => `article-${i + 1}`;

/** 이메일, 그리고 도메인으로 쓴 주소(oracle.com/legal/privacy, kopico.go.kr 등). 이메일을 먼저 본다 */
const LINK_PATTERN =
	/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|((?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|kr|io|org|net)(?:\/[\w\-./]*[\w/])?)/gi;

/** 글 속 이메일은 메일 쓰기, 주소는 새 탭 링크로 */
function linkify(text: string): React.ReactNode[] {
	const nodes: React.ReactNode[] = [];
	let last = 0;
	for (const match of text.matchAll(LINK_PATTERN)) {
		const [found, email, url] = match;
		const start = match.index ?? 0;
		if (start > last) nodes.push(text.slice(last, start));
		nodes.push(
			email ? (
				<a key={start} href={`mailto:${email}`}>
					{email}
				</a>
			) : (
				<ExternalLink key={start} href={/^https?:\/\//i.test(url) ? url : `https://${url}`}>
					{found}
				</ExternalLink>
			),
		);
		last = start + found.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}

/**
 * 이용약관·개인정보 처리방침 공통 화면.
 * 위: 두 문서 탭·제목·시행일 → 한눈에 보기 → 본문(넓은 화면은 왼쪽에 따라다니는 목차, 지금 읽는 조항 강조)
 */
export default function LegalDocument({ doc, title, effectiveDate, intro, summary, sections }: Props) {
	const active = useActiveSection(sections.length);

	const toc = (
		<ol>
			{sections.map((s, i) => (
				<li key={s.title} className={active === i ? 'active' : undefined}>
					<a href={`#${sectionId(i)}`}>
						<span className="no">{i + 1}</span>
						{s.title}
					</a>
				</li>
			))}
		</ol>
	);

	return (
		<article className="np-legal">
			<header className="doc-head">
				<nav className="tabs" aria-label="정책 문서">
					{DOCS.map((d) => (
						<Link key={d.key} href={d.href} aria-current={d.key === doc ? 'page' : undefined}>
							{d.title}
						</Link>
					))}
				</nav>
				<h1>{title}</h1>
				<p className="meta">시행일 {effectiveDate}</p>
				<p className="intro">{intro}</p>
			</header>

			{summary && (
				<section className="summary" aria-label="한눈에 보기">
					<h2>한눈에 보기</h2>
					<ul>
						{summary.map((item) => (
							<li key={item.title}>
								<span className="icon" aria-hidden>
									{ICONS[item.icon]}
								</span>
								<div>
									<strong>{item.title}</strong>
									<p>{item.text}</p>
								</div>
							</li>
						))}
					</ul>
				</section>
			)}

			<div className="layout">
				<aside className="toc" aria-label="목차">
					<p className="toc-title">목차</p>
					{toc}
				</aside>

				<details className="toc-mobile">
					<summary>목차 ({sections.length}개 조항)</summary>
					{toc}
				</details>

				<div className="body">
					{sections.map((s, i) => (
						<section key={s.title} id={sectionId(i)} className="article">
							<p className="article-no">제{i + 1}조</p>
							<h2>{s.title}</h2>
							{s.blocks.map((block, j) =>
								typeof block === 'string' ? (
									<p key={j}>{linkify(block)}</p>
								) : 'list' in block ? (
									<ul key={j}>
										{block.list.map((item) => (
											<li key={item}>{linkify(item)}</li>
										))}
									</ul>
								) : (
									<div key={j} className="table-wrap" role="region" aria-label={`${s.title} 표`} tabIndex={0}>
										<table className={block.table.head.length >= 4 ? 'wide' : undefined}>
											<thead>
												<tr>
													{block.table.head.map((h) => (
														<th key={h} scope="col">
															{h}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{block.table.rows.map((row) => (
													<tr key={row.join('|')}>
														{row.map((cell, k) => (
															<td key={k}>{linkify(cell)}</td>
														))}
													</tr>
												))}
											</tbody>
										</table>
									</div>
								),
							)}
						</section>
					))}
				</div>
			</div>
		</article>
	);
}

/** 화면 위쪽에 걸린 조항 번호 (목차 강조) */
function useActiveSection(count: number) {
	const [active, setActive] = useState(0);

	useEffect(() => {
		const els = Array.from({ length: count }, (_, i) => document.getElementById(sectionId(i))).filter(
			(el): el is HTMLElement => Boolean(el),
		);
		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries.filter((e) => e.isIntersecting).map((e) => els.indexOf(e.target as HTMLElement));
				if (visible.length) setActive(Math.min(...visible));
			},
			// 헤더 아래부터 화면 위쪽 40%를 "지금 읽는 곳"으로 본다
			{ rootMargin: '-80px 0px -60% 0px' },
		);
		els.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [count]);

	return active;
}

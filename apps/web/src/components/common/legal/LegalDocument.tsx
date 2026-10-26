'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ExternalLink from '@/components/common/ExternalLink';
import styled from 'styled-components';
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
		<StyledLegal>
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
									<div key={j} className="table" role="region" aria-label={`${s.title} 표`} tabIndex={0}>
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
		</StyledLegal>
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

const StyledLegal = styled.article`
	--sticky-top: 5rem;
	max-width: ${({ theme }) => theme.layout.width.large};
	margin: 0 auto;
	padding: 3rem 0 6rem;
	color: ${({ theme }) => theme.color.text};
	word-break: keep-all;

	/* ---------- 머리 ---------- */
	.doc-head {
		max-width: 44rem;
		margin-bottom: 2.5rem;
	}

	.tabs {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		a {
			margin-bottom: -1px;
			padding: 0 0 0.75rem;
			border-bottom: 2px solid transparent;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.medium};
			color: ${({ theme }) => theme.color.subText};

			&:hover {
				color: ${({ theme }) => theme.color.text};
			}

			&[aria-current='page'] {
				border-bottom-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.text};
				font-weight: ${({ theme }) => theme.fontWeight.bold};
			}
		}
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2rem;
		font-weight: ${({ theme }) => theme.fontWeight.extraBold};
		letter-spacing: -0.02em;
	}

	.meta {
		margin: 0 0 1.25rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
	}

	.intro {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.medium};
		line-height: 1.75;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	/* ---------- 한눈에 보기 ---------- */
	.summary {
		margin-bottom: 3.5rem;

		h2 {
			margin: 0 0 1rem;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			letter-spacing: 0.04em;
			color: ${({ theme }) => theme.color.subText};
		}

		ul {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.75rem;
			margin: 0;
			padding: 0;
			list-style: none;

			@media ${({ theme }) => theme.mediaQuery.tablet} {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				grid-template-columns: 1fr;
			}
		}

		li {
			display: flex;
			gap: 0.875rem;
			padding: 1.125rem 1.25rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.borderRadius.medium};
			background: ${({ theme }) => theme.color.background};
		}

		.icon {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2.25rem;
			height: 2.25rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.125rem;
				height: 1.125rem;
			}
		}

		strong {
			display: block;
			margin-bottom: 0.25rem;
			font-size: ${({ theme }) => theme.fontSize.small};
		}

		p {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			line-height: 1.6;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* ---------- 본문 + 목차 ---------- */
	.layout {
		display: grid;
		grid-template-columns: 15rem minmax(0, 44rem);
		gap: 4rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}
	}

	.toc {
		position: sticky;
		top: var(--sticky-top);
		align-self: start;
		max-height: calc(100vh - var(--sticky-top) - 2rem);
		overflow-y: auto;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: none;
		}
	}

	.toc-title {
		margin: 0 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		letter-spacing: 0.04em;
		color: ${({ theme }) => theme.color.subText};
	}

	.toc ol,
	.toc-mobile ol {
		margin: 0;
		padding: 0;
		list-style: none;
		border-left: 1px solid ${({ theme }) => theme.color.border};

		li a {
			display: flex;
			gap: 0.625rem;
			margin-left: -1px;
			padding: 0.4rem 0 0.4rem 0.875rem;
			border-left: 2px solid transparent;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			line-height: 1.5;
			color: ${({ theme }) => theme.color.subText};

			&:hover {
				color: ${({ theme }) => theme.color.text};
			}
		}

		.no {
			flex-shrink: 0;
			min-width: 1.25rem;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.lightGrey};
		}

		li.active a {
			border-left-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};

			.no {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.toc-mobile {
		display: none;
		margin-bottom: 2rem;
		padding: 0.875rem 1rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.borderRadius.medium};

		summary {
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			cursor: pointer;
		}

		ol {
			margin-top: 0.75rem;
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			display: block;
		}
	}

	/* ---------- 조항 ---------- */
	.article {
		padding: 2.25rem 0;
		border-top: 1px solid ${({ theme }) => theme.color.border};
		scroll-margin-top: var(--sticky-top);

		&:first-child {
			padding-top: 0;
			border-top: none;
		}
	}

	/* .article p보다 구체적이어야 강조색이 먹는다 */
	.article .article-no {
		margin: 0 0 0.375rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
	}

	.article h2 {
		margin: 0 0 1rem;
		font-size: 1.25rem;
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		line-height: 1.45;
	}

	.article p,
	.article ul {
		margin: 0 0 0.875rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.85;
		color: ${({ theme }) => theme.color.mediumGrey};
	}

	.article ul {
		padding-left: 1.125rem;

		li {
			margin-bottom: 0.375rem;

			&::marker {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	/* 글 속 링크 (이메일·주소) */
	/* 밑줄은 옅게 두었다가 마우스를 올리면 진하고 두껍게 (화살표 움직임은 ExternalLink) */
	.article a {
		color: ${({ theme }) => theme.color.primary};
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, ${({ theme }) => theme.color.primary} 35%, transparent);
		text-underline-offset: 3px;
		word-break: break-all;
		transition:
			text-decoration-color 0.2s ease,
			text-underline-offset 0.2s ease;

		&:hover,
		&:focus-visible {
			text-decoration-color: ${({ theme }) => theme.color.primary};
			text-underline-offset: 2px;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	/* 표: 가로선만, 머리는 옅은 면, 첫 칸 굵게. 좁으면 표만 가로로 넘긴다 */
	.table {
		margin: 0.25rem 0 1.25rem;
		overflow-x: auto;
		border-top: 2px solid ${({ theme }) => theme.color.text};

		&:focus-visible {
			outline: 2px solid ${({ theme }) => theme.color.primary};
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;

		/* 열이 많은 표만 좁은 화면에서 가로로 넘긴다 */
		&.wide {
			min-width: 44rem;

		}
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		line-height: 1.65;

		th,
		td {
			padding: 0.75rem 0.875rem;
			border-bottom: 1px solid ${({ theme }) => theme.color.border};
			text-align: left;
			vertical-align: top;
		}

		th {
			background: ${({ theme }) => theme.color.surface};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			white-space: nowrap;
		}

		td {
			color: ${({ theme }) => theme.color.mediumGrey};
		}

		td:first-child {
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.text};
		}

		/* 표 속 주소는 이름 아래 줄에 한 줄로 (짧은 주소라 꺾지 않는다. 좁으면 표가 가로로 넘어간다) */
		td a {
			display: block;
			margin-top: 0.125rem;
			font-weight: ${({ theme }) => theme.fontWeight.regular};
			white-space: nowrap;
			word-break: normal;
		}
	}
`;

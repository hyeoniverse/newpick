'use client';

import styled from 'styled-components';

/** 문단: 글자, 또는 목록 */
export type LegalBlock = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };
export type LegalSection = { title: string; blocks: LegalBlock[] };

interface Props {
	title: string;
	/** 시행일 'YYYY년 M월 D일' */
	effectiveDate: string;
	intro: string;
	sections: LegalSection[];
}

/** 이용약관·개인정보처리방침 공통 화면 */
export default function LegalDocument({ title, effectiveDate, intro, sections }: Props) {
	return (
		<StyledLegal>
			<header>
				<h1>{title}</h1>
				<p className="effective">시행일 {effectiveDate}</p>
				<p className="intro">{intro}</p>
			</header>

			<nav aria-label="목차">
				<ol>
					{sections.map((s, i) => (
						<li key={s.title}>
							<a href={`#section-${i + 1}`}>{s.title}</a>
						</li>
					))}
				</ol>
			</nav>

			{sections.map((s, i) => (
				<section key={s.title} id={`section-${i + 1}`}>
					<h2>
						제{i + 1}조 {s.title}
					</h2>
					{s.blocks.map((block, j) =>
						typeof block === 'string' ? (
							<p key={j}>{block}</p>
						) : 'list' in block ? (
							<ul key={j}>
								{block.list.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						) : (
							<div key={j} className="table">
								<table>
									<thead>
										<tr>
											{block.table.head.map((h) => (
												<th key={h}>{h}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{block.table.rows.map((row) => (
											<tr key={row.join('|')}>
												{row.map((cell, k) => (
													<td key={k}>{cell}</td>
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
		</StyledLegal>
	);
}

const StyledLegal = styled.article`
	max-width: 48rem;
	margin: 0 auto;
	padding: 3rem 1rem 5rem;
	color: ${({ theme }) => theme.color.text};
	line-height: 1.75;
	word-break: keep-all;

	header {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
		font-weight: 800;
	}

	.effective {
		margin: 0 0 1rem;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	.intro {
		margin: 0;
	}

	nav {
		margin-bottom: 2.5rem;
		padding: 1.25rem 1.5rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};

		ol {
			margin: 0;
			padding-left: 1.25rem;
			columns: 2;
			font-size: ${({ theme }) => theme.fontSize.small};

			@media ${({ theme }) => theme.mediaQuery.mobile} {
				columns: 1;
			}
		}

		a {
			color: ${({ theme }) => theme.color.subText};

			&:hover {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	section {
		margin-bottom: 2.25rem;
		scroll-margin-top: 6rem;
	}

	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		font-weight: 700;
	}

	p,
	ul {
		margin: 0 0 0.75rem;
		font-size: ${({ theme }) => theme.fontSize.medium};
	}

	ul {
		padding-left: 1.25rem;
	}

	.table {
		margin: 0 0 0.75rem;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: ${({ theme }) => theme.fontSize.small};

		th,
		td {
			padding: 0.625rem 0.75rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			text-align: left;
			vertical-align: top;
		}

		th {
			background: ${({ theme }) => theme.color.surface};
			font-weight: 700;
			white-space: nowrap;
		}
	}
`;

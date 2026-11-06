'use client';

import styled from 'styled-components';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 맞춤 메일이 사람마다 달라지는 세 가지 (edition/personalize.ts · personalNote.ts · 메일 칸) */
const POINTS = [
	{
		title: '내 관심 점수로 고른 순서',
		text: '그날 모든 분야의 소식에 북마크 · 스크랩한 글과 얼마나 가까운지 점수를 매겨 높은 순으로 엮습니다. 구독한 분야의 큰 소식은 늘 챙깁니다.',
	},
	{
		title: '나에게 쓴 브리핑',
		text: '요즘 북마크 · 스크랩한 주제를 바탕으로 메일 제목과 짧은 브리핑을 사람마다 따로 씁니다.',
	},
	{
		title: '내가 고른 칸',
		text: '지켜보던 소식의 후속, 팔로우한 태그의 소식, 뉴스레터에 안 실린 관련 기사까지 한 통에 담습니다.',
	},
];

/** 메일 모양 (장식): 맞춤 브리핑 → 후속 → 팔로우한 태그 → 오늘을 한눈에 순서로 칸이 하나씩 나타난다 */
function MailDemo() {
	return (
		<div className="mail" aria-hidden>
			<div className="mail-head">
				<span className="from">NEWPICK</span>
				<span className="subject">오늘 내 관심 소식 5개</span>
			</div>
			<div className="box briefing" style={{ '--k': 0 } as React.CSSProperties}>
				<span className="box-label">오늘의 맞춤 브리핑</span>
				<span className="line" style={{ width: '92%' }} />
				<span className="line" style={{ width: '70%' }} />
			</div>
			<div className="box follow" style={{ '--k': 1 } as React.CSSProperties}>
				<span className="box-label">지켜보던 소식의 후속</span>
				<span className="line strong" style={{ width: '64%' }} />
				<span className="line" style={{ width: '48%' }} />
			</div>
			<div className="box tags" style={{ '--k': 2 } as React.CSSProperties}>
				<span className="box-label">팔로우한 태그</span>
				<span className="chips">
					<span className="chip">#금리</span>
					<span className="chip">#반도체</span>
				</span>
				<span className="line" style={{ width: '58%' }} />
			</div>
			<div className="box top" style={{ '--k': 3 } as React.CSSProperties}>
				<span className="box-label">오늘을 한눈에</span>
				{[
					['경제', '92%'],
					['IT', '74%'],
					['세계', '80%'],
				].map(([category, width], i) => (
					<span key={category} className="row">
						<span className="no">{i + 1}</span>
						<span className="cat">{category}</span>
						<span className="line strong" style={{ width }} />
					</span>
				))}
			</div>
		</div>
	);
}

/**
 * 맞춤 뉴스레터: 같은 날 같은 소식이라도 사람마다 순서와 칸이 다른 메일.
 * 왼쪽 세 가지 설명, 오른쪽 메일 모양. 화면에 들어오면 칸이 위에서부터 하나씩 나타나고, 본문이 화면 가운데에 오면 다 나타난다(center)
 */
export default function PersonalSection() {
	const ref = useScrollProgress<HTMLDivElement>('center');

	return (
		<StyledPersonal data-track-section="about-personal" aria-label="맞춤 뉴스레터">
			<SectionHeading
				label="PERSONAL"
				title="같은 아침, 나에게 맞춘 한 통."
				sub="관심사 · 북마크 · 스크랩 · 팔로우한 태그 · 지켜보는 소식을 읽어, 사람마다 다른 순서와 칸으로 엮습니다."
			/>
			<div ref={ref} className="body">
				<ol className="points">
					{POINTS.map((point, i) => (
						<li key={point.title} className="point" style={{ '--i': i } as React.CSSProperties}>
							<span className="no">{String(i + 1).padStart(2, '0')}</span>
							<h3>{point.title}</h3>
							<p>{point.text}</p>
						</li>
					))}
				</ol>
				<div className="stage">
					<MailDemo />
				</div>
			</div>
			<p className="note">맞춤 메일은 마이페이지 설정에서 끄고 켤 수 있습니다. 끄면 분야별 뉴스레터로 옵니다.</p>
		</StyledPersonal>
	);
}

const StyledPersonal = styled.section`
	word-break: keep-all;

	.body {
		--progress: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: center;
		gap: 4rem;

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	.points {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* 설명 셋: 진행도에 따라 위에서부터 차례로 나타난다 */
	.point {
		opacity: clamp(0.25, calc(var(--progress) * 4 - var(--i)), 1);
		transform: translateY(calc((1 - clamp(0, calc(var(--progress) * 4 - var(--i)), 1)) * 0.5rem));

		.no {
			display: block;
			margin-bottom: 0.375rem;
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: 800;
			font-variant-numeric: tabular-nums;
			color: ${({ theme }) => theme.color.primary};
		}

		h3 {
			margin: 0 0 0.5rem;
			font-size: clamp(1.25rem, 2vw, 1.5rem);
			font-weight: 800;
			color: ${({ theme }) => theme.color.text};
		}

		p {
			margin: 0;
			line-height: 1.8;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 메일 모양: 회색 띠 위 흰 판 */
	.stage {
		display: grid;
		place-items: center;
		padding: 2.5rem;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.surface};

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			padding: 1.25rem;
		}
	}

	.mail {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 24rem;
		padding: 1.25rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
	}

	.mail-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};

		.from {
			font-weight: 800;
			color: ${({ theme }) => theme.color.primary};
		}

		.subject {
			font-size: ${({ theme }) => theme.fontSize.small};
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.text};
		}
	}

	/* 칸: 진행도에 따라 위에서부터 하나씩 (설명 셋보다 반 박자 늦게) */
	.box {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem 0.875rem;
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.tertiary};
		opacity: clamp(0, calc(var(--progress) * 5 - var(--k) - 0.5), 1);
		transform: translateY(calc((1 - clamp(0, calc(var(--progress) * 5 - var(--k) - 0.5), 1)) * 0.5rem));

		&.follow {
			background: ${({ theme }) => theme.color.background};
			border: 1px solid ${({ theme }) => theme.color.primary};
		}

		&.tags,
		&.top {
			background: ${({ theme }) => theme.color.background};
			border: 1px solid ${({ theme }) => theme.color.border};
		}
	}

	.box-label {
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
	}

	.line {
		display: block;
		height: 0.4375rem;
		border-radius: 0.25rem;
		background: ${({ theme }) => theme.color.border};

		&.strong {
			background: ${({ theme }) => theme.color.text};
			opacity: 0.8;
		}
	}

	.chips {
		display: flex;
		gap: 0.375rem;
	}

	.chip {
		padding: 0 0.5rem;
		border: 1px solid ${({ theme }) => theme.color.primary};
		border-radius: ${({ theme }) => theme.radius.chip};
		font-weight: ${({ theme }) => theme.fontWeight.bold};
		color: ${({ theme }) => theme.color.primary};
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;

		.no {
			font-weight: 800;
			color: ${({ theme }) => theme.color.primary};
		}

		.cat {
			font-weight: ${({ theme }) => theme.fontWeight.bold};
			color: ${({ theme }) => theme.color.subText};
		}

		.line {
			flex: 0 1 auto;
		}
	}

	.note {
		margin: 2rem 0 0;
		font-size: ${({ theme }) => theme.fontSize.small};
		color: ${({ theme }) => theme.color.subText};
	}

	@media (prefers-reduced-motion: reduce) {
		.point,
		.box {
			opacity: 1;
			transform: none;
		}
	}
`;

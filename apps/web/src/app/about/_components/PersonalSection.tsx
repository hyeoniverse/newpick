'use client';

import { ABOUT } from '@/copy';
import SectionHeading from '@/app/about/_components/SectionHeading';
import { useScrollProgress } from '@/hooks/useScrollProgress';

/** 맞춤 메일이 사람마다 달라지는 세 가지 (edition/personalize.ts · personal-note.ts · 메일 칸) */
const POINTS = [
	{
		title: '관심 있는 소식부터',
		text: ABOUT.personal.first,
	},
	{
		title: '나를 위한 브리핑',
		text: ABOUT.personal.briefing,
	},
	{
		title: '놓치기 쉬운 소식까지',
		text: ABOUT.personal.more,
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
		<section
			className="np-about-personal-section-personal"
			data-track-section="about-personal"
			aria-label="맞춤 뉴스레터"
		>
			<SectionHeading label="PERSONAL" title="매일 같은 아침, 나만을 위한 뉴스레터" sub={ABOUT.personal.sub} />
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
			<p className="note">{ABOUT.personal.note}</p>
		</section>
	);
}

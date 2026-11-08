'use client';

import { useScrollProgress } from '@/hooks/useScrollProgress';
import { cx } from '@/styles/tw';

/** 강조할 낱말은 ** 로 감싼다 */
const STATEMENT =
	'매일 쏟아지는 수많은 뉴스, 다 챙기기는 어렵습니다. NEWPICK은 그중 **내 관심사**의 **중요한 소식만** 골라, **읽기 좋게** 정리해 보내 드립니다.';

const WORDS = STATEMENT.split(' ').map((word) => ({
	text: word.replaceAll('**', ''),
	strong: word.includes('**'),
}));

/**
 * 첫 화면 다음의 큰 문장. 스크롤하는 동안 낱말 단위로 차례로 밝아진다 (--progress × 낱말 수 - 순서).
 * 글자는 처음부터 모두 들어 있어 화면 낭독기는 그대로 읽는다
 */
export default function StatementSection() {
	// 긴 문장이라 through 구간(화면 아래에서 가운데까지)에 낱말이 밝아진다. 마지막 낱말은 구간 끝에서 (계수 1.05)
	const ref = useScrollProgress<HTMLParagraphElement>('through');

	return (
		<StyledStatement data-track-section="about-statement" aria-label="NEWPICK 소개">
			<p ref={ref} className="statement" style={{ '--n': WORDS.length } as React.CSSProperties}>
				{WORDS.map((word, i) => (
					<span key={i} className={word.strong ? 'word strong' : 'word'} style={{ '--i': i } as React.CSSProperties}>
						{word.text}{' '}
					</span>
				))}
			</p>
		</StyledStatement>
	);
}

const StyledStatement = ({ className, ...props }: React.ComponentProps<'section'>) => (
	<section className={cx('np-about-statement-section-statement', className)} {...props} />
);

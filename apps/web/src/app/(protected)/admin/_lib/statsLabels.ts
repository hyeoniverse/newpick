import { usd } from './format';

/** 관리자 통계 이름표 · 형식 (#198) */
export const TYPE_LABEL: Record<string, string> = {
	summarization: '뉴스레터 쓰기',
	category: '기사 분류',
	edition: '하루 편집',
};
export const STAGE_LABEL: Record<string, string> = {
	select: '고르기',
	write: '쓰기',
	category: '분류',
	edition: '편집',
	summarization: '뉴스레터 쓰기',
	mixed: '나눔 모름 (이전 기록)',
};
/** 'claude-haiku-5-5' → 'Haiku 5.5' */
export const modelName = (model: string) =>
	model === 'mixed'
		? '나눔 모름 (이전 기록)'
		: model
				.replace(/^claude-/, '')
				.replace(/-(\d+)(?:-(\d+))?.*$/, (_, a, b) => ` ${a}${b ? `.${b}` : ''}`)
				.replace(/^\w/, (c) => c.toUpperCase());

export const people = (n: number) => `${n.toLocaleString()}명`;
export const money = (n: number) => usd(n);

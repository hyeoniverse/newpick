import type { AiLogRow } from '@newpick/shared';

/* AI 기록의 다시 시도 묶음 계산 (#198) */

/**
 * 다시 만들 수 있는 기록: 분야가 있는 요약이 실패했고, 그 묶음의 마지막 시도도 실패로 끝난 것.
 * (묶음 중간 실패는 뒤에서 이미 다시 시도했다)
 */
export const canRerun = (log: AiLogRow) =>
	log.processType === 'summarization' &&
	log.status === 'error' &&
	log.categoryId != null &&
	(!log.attempt || (log.attempt.n === log.attempt.total && log.attempt.outcome !== 'success'));

/** 같은 묶음(다시 시도)의 기록을 붙여 놓는다. 묶음 자리는 가장 최근 시도가 있던 자리, 묶음 안은 최신순 그대로 */
export function groupAttempts(items: AiLogRow[]) {
	const placed = new Set<number>();
	const out: AiLogRow[] = [];
	for (const item of items) {
		const chain = item.attempt && item.attempt.total > 1 ? item.attempt.chain : null;
		if (chain === null) {
			out.push(item);
			continue;
		}
		if (placed.has(chain)) continue;
		placed.add(chain);
		out.push(...items.filter((other) => other.attempt?.chain === chain));
	}
	return out;
}

/** 카드 목록(휴대폰)용: 이어진 같은 묶음을 [마지막 시도, ...앞선 시도]로 */
export function chainGroups(rows: AiLogRow[]) {
	const out: AiLogRow[][] = [];
	for (const log of rows) {
		const last = out.at(-1);
		const chain = log.attempt && log.attempt.total > 1 ? log.attempt.chain : null;
		if (chain !== null && last && last[0].attempt?.chain === chain) last.push(log);
		else out.push([log]);
	}
	return out;
}

/** 'claude-haiku-5-5, claude-sonnet-5' → ['haiku-5-5', 'sonnet-5'] */
export const modelNames = (model: string | null) =>
	model ? model.split(',').map((name) => name.trim().replace(/^claude-/, '')) : [];

/** 토큰: 입력 / 출력을 알면 둘 다, 아니면 합계 (없으면 null) */
export const tokensText = (log: Pick<AiLogRow, 'inputTokens' | 'outputTokens' | 'token'>) =>
	log.inputTokens || log.outputTokens
		? `${log.inputTokens.toLocaleString()} / ${log.outputTokens.toLocaleString()}`
		: log.token
			? log.token.toLocaleString()
			: null;

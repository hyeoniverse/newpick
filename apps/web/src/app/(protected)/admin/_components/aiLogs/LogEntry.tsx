'use client';

import type { AiLogRow } from '@newpick/shared';
import { LuRotateCw } from 'react-icons/lu';
import { PROCESS_LABEL, usd, when } from '../../_lib/format';
import { canRerun, modelNames, tokensText } from '../../_lib/aiLogs';
import { useExpand } from './useExpand';

/**
 * 휴대폰 활동 목록 한 줄: 왼쪽 상태 점(성공 · 실패), 분야 · 종류와 시각, 내용 두 줄, 결과 · 걸린 시간 · 비용.
 * 누르면 내용 전체와 모델 · 토큰. 같은 묶음의 앞선 시도(earlier)는 점을 세로선으로 이어 타임라인처럼
 */
export default function LogEntry({
	log,
	today,
	earlier,
	open,
	onToggle,
	onRerun,
}: {
	log: AiLogRow;
	today: string;
	earlier: boolean;
	open: boolean;
	onToggle: () => void;
	onRerun: (log: AiLogRow) => void;
}) {
	const ok = log.status === 'success';
	const attempt = log.attempt && log.attempt.total > 1 ? log.attempt : null;
	const text = useExpand(open);
	const model = modelNames(log.model).join(', ') || undefined;
	const tokens = tokensText(log);
	return (
		<li className={[earlier && 'earlier', ok ? 'ok' : 'failed'].filter(Boolean).join(' ')}>
			<span className="dot" aria-hidden />
			<button type="button" className="entry" aria-expanded={open} onClick={onToggle}>
				<span className="line">
					<span className="what">
						{log.category && <strong>{log.category}</strong>}
						{PROCESS_LABEL[log.processType] ?? log.processType}
					</span>
					<time className="when">{when(log.createdAt, today)}</time>
				</span>
				<span ref={text.ref} className={text.clamped ? 'text clamped' : 'text'} onTransitionEnd={text.onTransitionEnd}>
					{log.error ?? log.result ?? ''}
				</span>
				<span className="foot">
					<span className="status">
						{ok ? '성공' : '실패'}
						{attempt && ` · 시도 ${attempt.n}/${attempt.total}`}
					</span>
					<span>{log.duration.toFixed(1)}초</span>
					{log.costUsd != null && <span>{usd(log.costUsd)}</span>}
				</span>
				{(model || tokens) && (
					<span className={open ? 'more-panel open' : 'more-panel'} aria-hidden={!open}>
						<span className="more">
							{model && <span>모델 {model}</span>}
							{tokens && <span>토큰 {tokens}</span>}
						</span>
					</span>
				)}
			</button>
			{canRerun(log) && (
				<button type="button" className="rerun" onClick={() => onRerun(log)}>
					<LuRotateCw aria-hidden />
					다시 만들기
				</button>
			)}
		</li>
	);
}

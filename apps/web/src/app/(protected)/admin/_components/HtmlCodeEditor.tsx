'use client';

import { Fragment } from 'react';
import styled from 'styled-components';
import { INDENT } from './htmlFormat';

interface Props {
	value: string;
	onChange: (value: string) => void;
	id?: string;
	rows?: number;
}

/** 한 줄을 색칠한다: 앞 들여쓰기는 깊이마다 무지개 띠, 태그 이름 · 속성 · 값 · 글자는 색으로 */
function paintLine(line: string, key: number) {
	const indent = line.match(/^ */)?.[0].length ?? 0;
	const levels = Math.floor(indent / INDENT.length);
	const rest = line.slice(levels * INDENT.length);
	const parts: React.ReactNode[] = [];
	for (let i = 0; i < levels; i++) {
		parts.push(
			<span key={`i${i}`} className={`indent level-${i % 6}`}>
				{INDENT}
			</span>,
		);
	}
	// 태그와 글자를 번갈아 자른다
	const re = /<[^>]*>?/g;
	let last = 0;
	let m: RegExpExecArray | null;
	let n = 0;
	while ((m = re.exec(rest))) {
		if (m.index > last) parts.push(<span key={`t${n++}`}>{rest.slice(last, m.index)}</span>);
		parts.push(<Fragment key={`g${n++}`}>{paintTag(m[0])}</Fragment>);
		last = m.index + m[0].length;
	}
	if (last < rest.length) parts.push(<span key={`t${n++}`}>{rest.slice(last)}</span>);
	// 줄마다 블록 하나: 왼쪽에 줄 번호(CSS counter), 빈 줄도 높이를 갖도록 공백 하나
	return (
		<div key={key} className="line">
			{parts.length ? parts : ' '}
		</div>
	);
}

/** 태그 하나: '<' · 이름 · 속성="값" · '>' */
function paintTag(tag: string) {
	const head = tag.match(/^<\/?[a-zA-Z0-9-]*/)?.[0] ?? '<';
	const close = tag.endsWith('/>') ? '/>' : tag.endsWith('>') ? '>' : '';
	const body = tag.slice(head.length, tag.length - close.length);
	const out: React.ReactNode[] = [
		<span key="p" className="punct">
			{head.startsWith('</') ? '</' : '<'}
		</span>,
		<span key="n" className="tag">
			{head.replace(/^<\/?/, '')}
		</span>,
	];
	const attr = /(\s+)([^\s=]+)(?:(=)("[^"]*"?|'[^']*'?|[^\s"']*))?/g;
	let last = 0;
	let m: RegExpExecArray | null;
	let i = 0;
	while ((m = attr.exec(body))) {
		if (m.index > last) out.push(<span key={`r${i++}`}>{body.slice(last, m.index)}</span>);
		out.push(
			<Fragment key={`a${i++}`}>
				{m[1]}
				<span className="attr">{m[2]}</span>
				{m[3] && <span className="punct">=</span>}
				{m[4] !== undefined && <span className="value">{m[4]}</span>}
			</Fragment>,
		);
		last = m.index + m[0].length;
	}
	if (last < body.length) out.push(<span key={`r${i++}`}>{body.slice(last)}</span>);
	if (close)
		out.push(
			<span key="c" className="punct">
				{close}
			</span>,
		);
	return out;
}

/**
 * HTML 편집 칸 (관리자 뉴스레터 고치기 #31): VS Code의 indent-rainbow처럼 들여쓰기 깊이마다 옅은 색 띠,
 * 태그 · 속성 · 값을 색으로 나눈다. 실제 입력은 투명 글자의 textarea, 그 뒤에 같은 글을 색칠한 사본을 겹쳐 그린다
 * (패키지 없이). 두 겹은 글 높이만큼 같이 늘어나고 바깥 칸 하나만 스크롤해 어긋나지 않는다. 왼쪽에 줄 번호
 */
export default function HtmlCodeEditor({ value, onChange, id, rows = 20 }: Props) {
	return (
		<StyledEditor $rows={rows}>
			<div className="stack">
				<div className="gutter" aria-hidden />
				<pre className="paint" aria-hidden>
					{value.split('\n').map(paintLine)}
				</pre>
				<textarea
					id={id}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={(event) => {
						// Tab은 들여쓰기 두 칸 (칸 밖으로 나가지 않게)
						if (event.key !== 'Tab' || event.shiftKey) return;
						event.preventDefault();
						const el = event.currentTarget;
						const { selectionStart: s, selectionEnd: e } = el;
						onChange(value.slice(0, s) + INDENT + value.slice(e));
						requestAnimationFrame(() => el.setSelectionRange(s + INDENT.length, s + INDENT.length));
					}}
					spellCheck={false}
					autoCapitalize="off"
					autoComplete="off"
				/>
			</div>
		</StyledEditor>
	);
}

/* indent-rainbow 색 (노랑 · 초록 · 분홍 · 하늘 · 주황 · 보라). 흰 바탕에서 칙칙하지 않게 채도 높게 */
const RAINBOW = ['255, 204, 0', '52, 199, 89', '255, 45, 146', '0, 174, 255', '255, 132, 0', '138, 92, 255'];

/** 줄 번호 칸 너비 (textarea도 같은 만큼 비운다) */
const GUTTER = '3rem';

const StyledEditor = styled.div<{ $rows: number }>`
	max-height: ${({ $rows }) => `calc(${$rows} * 1.6em + 1.25rem)`};
	overflow: auto;
	resize: vertical;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.control};
	background: ${({ theme }) => theme.color.background};
	font-size: ${({ theme }) => theme.fontSize.extraSmall};
	line-height: 1.6;

	&:focus-within {
		border-color: ${({ theme }) => theme.color.primary};
	}

	.stack {
		position: relative;
		counter-reset: line;
	}

	/* 전역 '* { font-family }'가 색칠한 글자에 붙지 않게: 두 겹 모두 같은 고정폭 글꼴 */
	.stack,
	.stack * {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: inherit;
		line-height: inherit;
	}

	.gutter {
		position: absolute;
		inset: 0 auto 0 0;
		width: ${GUTTER};
		border-right: 1px solid ${({ theme }) => theme.color.border};
		background: ${({ theme }) => theme.color.surface};
	}

	/* 두 겹이 글자 하나까지 같은 자리에 오도록 모양을 똑같이 */
	.paint,
	textarea {
		margin: 0;
		padding: 0.625rem 0.75rem 0.625rem calc(${GUTTER} + 0.75rem);
		border: 0;
		letter-spacing: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.paint {
		position: relative;
		min-height: ${({ $rows }) => `calc(${$rows} * 1.6em + 1.25rem)`};
		pointer-events: none;
		color: ${({ theme }) => theme.color.text};
	}

	.line {
		position: relative;
		counter-increment: line;

		&::before {
			content: counter(line);
			position: absolute;
			left: calc(-${GUTTER} - 0.75rem);
			width: calc(${GUTTER} - 0.5rem);
			text-align: right;
			color: ${({ theme }) => theme.color.lightGrey};
			font-size: 0.75rem;
		}
	}

	textarea {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		resize: none;
		background: transparent;
		color: transparent;
		caret-color: ${({ theme }) => theme.color.text};
		outline: none;

		&::selection {
			background: color-mix(in srgb, ${({ theme }) => theme.color.primary} 25%, transparent);
			color: transparent;
		}
	}

	${RAINBOW.map(
		(rgb, i) => `
	.level-${i} {
		background: rgba(${rgb}, 0.22);
		box-shadow: inset 2px 0 rgba(${rgb}, 0.75);
	}`,
	).join('')}

	.tag {
		color: #d6266f;
		font-weight: ${({ theme }) => theme.fontWeight.semiBold};
	}

	.attr {
		color: #7b3fe4;
	}

	.value {
		color: #0a7d3e;
	}

	.punct {
		color: #8a94a6;
	}

	/* 어두운 테마 */
	:root[data-theme='dark'] & {
		.tag {
			color: #ff7ab2;
		}

		.attr {
			color: #c4a5ff;
		}

		.value {
			color: #7ee2a8;
		}
	}
`;

'use client';

import { Fragment } from 'react';
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
		<div className="np-admin-html-code-editor-editor" style={{ '--editor-rows': rows } as React.CSSProperties}>
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
		</div>
	);
}

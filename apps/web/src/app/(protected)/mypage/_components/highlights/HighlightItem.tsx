'use client';

import { ACTIONS } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { useState } from 'react';
import Link from 'next/link';
import type { Highlight } from '@newpick/shared';
import StarToggle from '@/components/common/icons/StarToggle';
import InputCheck from '@/components/common/InputCheck';
import { useHighlightMutations } from '@/hooks/useHighlights';
import { dateFormatter } from '@/utils/formatter';
import FolderMenu from '../folders/FolderMenu';

/** 스크랩한 문장 하나: 중요 표시 · 고르기 · 원문에서 보기 · 메모 · 폴더 옮기기 · 지우기 · 끌어서 폴더에 넣기 */
export default function HighlightItem({
	highlight,
	index,
	folder,
	focused,
	dragged,
	selecting,
	checked,
	onToggle,
	onRemove,
	onDragStart,
	onDragEnd,
}: {
	highlight: Highlight;
	/** 블록 안 몇 번째 문장인지 (1부터) */
	index: number;
	/** 들어 있는 폴더 이름 ('모든 스크랩'에서만) */
	folder?: string;
	focused: boolean;
	/** 끄는 중 (흐리게) */
	dragged: boolean;
	selecting: boolean;
	checked: boolean;
	onToggle: () => void;
	onRemove: () => void;
	onDragStart: (event: React.DragEvent) => void;
	onDragEnd: () => void;
}) {
	const { update, bulk } = useHighlightMutations();
	const [editing, setEditing] = useState(false);
	const [note, setNote] = useState(highlight.note ?? '');

	return (
		<article
			id={`hl-${highlight.id}`}
			className={`item ${focused ? 'focused' : ''} ${selecting ? 'selecting' : ''} ${checked ? 'checked' : ''} ${dragged ? 'dragging' : ''}`}
			title={`${dateFormatter(highlight.createdAt)} 스크랩`}
			// 고르는 중에는 문장 어디를 눌러도 고르기
			onClick={selecting ? onToggle : undefined}
			// 끌어서 폴더에 넣기 (데스크톱 마우스. 메모를 고치는 중엔 끌지 않음)
			draggable={!editing}
			onDragStart={(event) => {
				event.dataTransfer.effectAllowed = 'move';
				event.dataTransfer.setData('text/plain', highlight.text);
				event.stopPropagation();
				onDragStart(event);
			}}
			onDragEnd={onDragEnd}
		>
			{/* 머리 줄: 스크랩한 문장 N | 폴더 ……… 중요 표시 */}
			<div className="item-head">
				<span className="item-label">
					스크랩한 문장 <span className="count">{index}</span>
				</span>
				{folder && <span className="folder">{folder}</span>}
				{!selecting && (
					<StarToggle
						className="star-toggle"
						pressed={highlight.starred}
						onToggle={() => update.mutate({ id: highlight.id, starred: !highlight.starred })}
					/>
				)}
			</div>
			<p className="quote">
				{selecting ? (
					// 상자를 누른 것이 문장 누르기(고르기)로 한 번 더 번지지 않게
					<span className="pick" onClick={(e) => e.stopPropagation()}>
						<InputCheck
							name={`highlight-pick-${highlight.id}`}
							size="small"
							checked={checked}
							onCheckedChange={onToggle}
							aria-label={`${highlight.text.slice(0, 20)} 선택`}
						/>
					</span>
				) : (
					/* 따옴표는 자리를 차지하지 않고 문장 첫 글자 뒤에 겹쳐 그린다 (문장은 다른 줄과 같은 왼쪽 끝) */
					<span className="quote-mark" aria-hidden>
						“
					</span>
				)}
				<span>{highlight.text}</span>
			</p>
			<div className="tools" hidden={selecting}>
				<Link href={`${ROUTES.article(highlight.newsletterId)}?hl=${highlight.id}`}>원문에서 보기</Link>
				{!editing && (
					<button type="button" onClick={() => setEditing(true)}>
						{highlight.note ? '메모 고치기' : '메모 남기기'}
					</button>
				)}
				<FolderMenu
					label="폴더 옮기기"
					current={highlight.folderId}
					onPick={(folderId) => bulk.mutate({ ids: [highlight.id], action: 'move', folderId })}
				/>
				<button type="button" className="danger" onClick={onRemove}>
					{ACTIONS.remove}
				</button>
			</div>
			{editing ? (
				<form
					className="edit"
					onSubmit={(event) => {
						event.preventDefault();
						update.mutate({ id: highlight.id, note }, { onSuccess: () => setEditing(false) });
					}}
				>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={3}
						maxLength={2000}
						placeholder="이 문장에 대한 내 생각"
						aria-label="메모"
						autoFocus
					/>
					<div className="actions">
						<button
							type="button"
							onClick={() => {
								setNote(highlight.note ?? '');
								setEditing(false);
							}}
						>
							{ACTIONS.cancel}
						</button>
						<button type="submit" className="primary" disabled={update.isPending}>
							{ACTIONS.save}
						</button>
					</div>
				</form>
			) : (
				highlight.note && (
					<p className="note">
						<span className="note-label">메모</span>
						{highlight.note}
					</p>
				)
			)}
		</article>
	);
}

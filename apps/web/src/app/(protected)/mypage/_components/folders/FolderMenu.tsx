'use client';

import { useRef, useState } from 'react';
import { useDismiss } from '@/hooks/useDismiss';
import { useTopLayer } from '@/hooks/useTopLayer';
import { LuCheck, LuFolder, LuFolderCheck, LuFolderPlus } from 'react-icons/lu';
import { useFolderMutations, useFolders } from '@/hooks/useFolders';
import { cx } from '@/styles/tw';

interface Props {
	/** 단추 글 (예: '폴더 옮기기', '폴더로 옮기기') */
	label: string;
	/** 지금 폴더 (한 개 옮길 때 표시용, 여러 개면 생략) */
	current?: number | null;
	/** 고른 폴더 (null = 폴더 없음) */
	onPick: (folderId: number | null) => void;
	/** 메뉴를 위로 펼칠지 (화면 아래 막대에서). 휴대폰에서는 화면 아래 막대 바로 위에 폭 가득 붙인다 */
	up?: boolean;
	/** 메뉴를 단추의 왼쪽(start) · 오른쪽(end) 끝에 맞춘다. 줄 오른쪽 끝 단추는 end */
	align?: 'start' | 'end';
	/** 단추에 폴더 아이콘을 붙인다. 좁은 곳에서는 CSS가 글자를 숨겨 아이콘만 (이름은 aria-label로 그대로) */
	icon?: boolean;
	className?: string;
	disabled?: boolean;
}

/**
 * 폴더 고르기 메뉴 (#123): 폴더 없음 · 내 폴더들 · 새 폴더 만들고 바로 옮기기.
 * 스크랩 · 북마크 · 받은 메일의 '폴더 옮기기'와 선택 막대의 '폴더로 옮기기'가 같이 쓴다.
 * 메뉴는 top layer(popover)에 띄워, 카드처럼 넘치는 내용을 자르는 틀 안에서 열어도 잘리지 않게 한다 (#313)
 */
export default function FolderMenu({
	label,
	current,
	onPick,
	up = false,
	align = 'start',
	icon = false,
	className,
	disabled,
}: Props) {
	const { data: folders = [] } = useFolders();
	const { create } = useFolderMutations();
	const [open, setOpen] = useState(false);
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState('');
	const boxRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	// 실제로 스크롤하거나(40px 넘게) 크기가 바뀌면 닫는다 (누를 때 생기는 작은 움직임은 무시).
	// 바깥을 눌러 닫을 때 그 클릭은 뒤로 보내지 않는다: 메뉴를 닫으려고 누른 곳의 메일 · 카드가 열리던 것
	useDismiss({
		open,
		refs: [boxRef],
		onClose: () => setOpen(false),
		scroll: 40,
		resize: true,
		blockClickThrough: true,
	});
	// 단추 바로 아래에, 아래 자리가 모자라면(화면 아래쪽 카드 · 메일 줄) 위로. 화면 아래 막대에서는 늘 위로
	useTopLayer({ open, anchorRef: boxRef, panelRef: menuRef, gap: 6, align, vertical: up ? 'up' : 'auto' });

	const toggle = () => setOpen((v) => !v);

	const pick = (folderId: number | null) => {
		setOpen(false);
		setAdding(false);
		onPick(folderId);
	};

	return (
		<div ref={boxRef} className={cx('np-mypage-folder-menu-folder-menu', className)}>
			<button
				type="button"
				className="trigger"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={icon ? label : undefined}
				title={icon ? label : undefined}
				disabled={disabled}
				onClick={toggle}
			>
				{icon ? (
					<>
						{/* 폴더에 넣었으면 체크가 있는 폴더 (좁은 곳에서는 글자가 숨어 이것으로 구분) */}
						{current ? (
							<LuFolderCheck aria-hidden className="trigger-icon" />
						) : (
							<LuFolder aria-hidden className="trigger-icon" />
						)}
						<span className="trigger-text">{label}</span>
					</>
				) : (
					label
				)}
			</button>
			{open && (
				<div
					ref={menuRef}
					popover="manual"
					className="np-mypage-folder-menu-menu folder-menu"
					role="menu"
					data-sheet={up || undefined}
				>
					<button type="button" role="menuitem" onClick={() => pick(null)}>
						<LuFolder aria-hidden className="muted" /> 폴더 없음
						{current === null && <LuCheck aria-hidden className="check" />}
					</button>
					{folders.map((folder) => (
						<button key={folder.id} type="button" role="menuitem" onClick={() => pick(folder.id)}>
							<LuFolder aria-hidden /> {folder.name}
							{current === folder.id && <LuCheck aria-hidden className="check" />}
						</button>
					))}
					{adding ? (
						<form
							className="add"
							onSubmit={(event) => {
								event.preventDefault();
								const trimmed = name.trim();
								if (!trimmed) return;
								// 만들고 바로 그 폴더로 옮긴다
								create.mutate(trimmed, { onSuccess: (folder) => pick(folder.id) });
								setName('');
							}}
						>
							<input
								value={name}
								onChange={(e) => setName(e.target.value)}
								maxLength={30}
								placeholder="새 폴더 이름"
								aria-label="새 폴더 이름"
								autoFocus
							/>
							<button type="submit" disabled={!name.trim() || create.isPending}>
								만들기
							</button>
						</form>
					) : (
						<button type="button" role="menuitem" className="new" onClick={() => setAdding(true)}>
							<LuFolderPlus aria-hidden /> 새 폴더 만들어 옮기기
						</button>
					)}
				</div>
			)}
		</div>
	);
}

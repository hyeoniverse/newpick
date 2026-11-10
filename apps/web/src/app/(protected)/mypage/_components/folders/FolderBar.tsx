'use client';

import { useState } from 'react';
import { LuFolder, LuFolderPlus } from 'react-icons/lu';
import { useModal } from '@/hooks/useModal';
import { Folder, useFolderMutations } from '@/hooks/useFolders';
import { useHideScrollButtons } from '@/components/common/ScrollButtons';
import FolderDeleteModal from './FolderDeleteModal';

/** 폴더 거르기 값: 'all' 모두 · 'none' 폴더 없음 · 폴더 번호 */
export type FolderFilter = 'all' | 'none' | number;

interface Props {
	folders: Folder[];
	/** 이 탭에서 폴더마다 개수 (스크랩 · 북마크 · 받은 메일) */
	countOf: (folder: Folder) => number;
	/** 이 탭에서 '모두'를 부르는 이름 (예: '모든 스크랩', '모든 북마크') */
	allLabel: string;
	value: FolderFilter;
	onChange: (value: FolderFilter) => void;
	/** 이 탭의 전체 수 · 폴더 없는 수 */
	total: number;
	unfiled: number;
	/** 끄는 중인 것의 수 (0이면 끄는 중 아님) */
	dragging?: number;
	/** 끈 것을 놓은 폴더 (null = 폴더 없음) */
	onDropTo?: (folderId: number | null) => void;
}

/**
 * 폴더 줄 (#123, 스크랩 · 북마크 · 받은 메일 공통): 모두 · 폴더 없음 · 내 폴더들 · 새 폴더. 개수는 그 탭 기준.
 * 폴더를 고르면 옆에 이름 바꾸기 · 지우기 (지울 때 안의 것들을 남길지 · 옮길지 · 같이 지울지 고름)
 */
export default function FolderBar({
	folders,
	countOf,
	allLabel,
	value,
	onChange,
	total,
	unfiled,
	dragging = 0,
	onDropTo,
}: Props) {
	const { create, rename, remove } = useFolderMutations();
	const { openModal, closeModal } = useModal();
	const [adding, setAdding] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [name, setName] = useState('');
	const current = typeof value === 'number' ? folders.find((f) => f.id === value) : undefined;
	// 끄는 중 마우스가 올라간 폴더 (강조)
	const [over, setOver] = useState<FolderFilter | null>(null);
	// 끄는 동안 위로 · 아래로 단추는 숨긴다 (누를 수 없고, 아래에 뜨는 폴더 칸 옆을 가린다)
	useHideScrollButtons(dragging > 0);
	// 폴더 칸이 옆으로 넘칠 때 가려진 쪽 끝을 흐리게 (더 있다는 표시)
	const [more, setMore] = useState({ left: false, right: false });
	const measure = (el: HTMLElement | null) => {
		if (!el) return;
		const next = { left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 };
		setMore((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
	};
	/** 끌어 놓을 수 있는 칸 ('모두'는 빼고) */
	const dropProps = (key: Exclude<FolderFilter, 'all'>) => ({
		onDragOver: (event: React.DragEvent) => {
			if (!dragging) return;
			event.preventDefault();
			event.dataTransfer.dropEffect = 'move';
			setOver(key);
		},
		onDragLeave: () => setOver((prev) => (prev === key ? null : prev)),
		onDrop: (event: React.DragEvent) => {
			event.preventDefault();
			setOver(null);
			onDropTo?.(key === 'none' ? null : key);
		},
	});

	const confirmRemove = (folder: Folder) => {
		openModal(
			<FolderDeleteModal
				folder={folder}
				others={folders.filter((f) => f.id !== folder.id)}
				onCancel={closeModal}
				onConfirm={(contents, to) => {
					closeModal();
					remove.mutate({ id: folder.id, contents, to }, { onSuccess: () => onChange('all') });
				}}
			/>,
		);
	};

	const chip = (key: FolderFilter, label: React.ReactNode, count: number) => (
		<button
			key={String(key)}
			type="button"
			className={`chip ${dragging && key !== 'all' ? 'droppable' : ''} ${over === key ? 'over' : ''}`}
			aria-pressed={value === key}
			{...(key !== 'all' && dropProps(key))}
			onClick={() => {
				setRenaming(false);
				onChange(key);
			}}
		>
			{label}
			<span className="count">{count}</span>
		</button>
	);

	return (
		<div className="np-mypage-folder-bar-folder-bar" role="group" aria-label="폴더">
			{/* 끄는 중: 화면 아래에 폴더 칸을 띄워 멀리 끌고 올라가지 않아도 놓을 수 있게 (스크랩 선택 막대와 같은 자리).
			    폴더는 한 줄, 넘치면 옆으로: 끄는 채로 칸 양 끝에 가져가면 그쪽으로 넘어간다 */}
			{dragging > 0 && (
				<div className="drop-dock" aria-hidden>
					<p>{dragging > 1 ? `${dragging}개를` : '여기에'} 놓을 폴더</p>
					<div
						ref={measure}
						className={['targets', more.left && 'more-left', more.right && 'more-right'].filter(Boolean).join(' ')}
						onScroll={(event) => measure(event.currentTarget)}
						onDragOver={(event) => {
							const box = event.currentTarget.getBoundingClientRect();
							const edge = 48;
							if (event.clientX < box.left + edge) event.currentTarget.scrollLeft -= 12;
							else if (event.clientX > box.right - edge) event.currentTarget.scrollLeft += 12;
						}}
					>
						<div className={`target ${over === 'none' ? 'over' : ''}`} {...dropProps('none')}>
							폴더 없음
						</div>
						{folders.map((f) => (
							<div key={f.id} className={`target ${over === f.id ? 'over' : ''}`} {...dropProps(f.id)}>
								<LuFolder /> {f.name}
							</div>
						))}
						{folders.length === 0 && <span className="hint">먼저 &lsquo;새 폴더&rsquo;로 폴더를 만들어 주십시오</span>}
					</div>
				</div>
			)}
			<div className="chips">
				{chip('all', allLabel, total)}
				{chip('none', '폴더 없음', unfiled)}
				{folders.map((f) =>
					chip(
						f.id,
						<>
							<LuFolder aria-hidden /> {f.name}
						</>,
						countOf(f),
					),
				)}
				{adding ? (
					<form
						className="inline-form"
						onSubmit={(event) => {
							event.preventDefault();
							const trimmed = name.trim();
							if (!trimmed) return;
							create.mutate(trimmed, {
								onSuccess: (folder) => {
									setAdding(false);
									setName('');
									onChange(folder.id);
								},
							});
						}}
					>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
							maxLength={30}
							placeholder="새 폴더 이름"
							aria-label="새 폴더 이름"
							autoFocus
						/>
						<button type="submit" className="save" disabled={!name.trim() || create.isPending}>
							만들기
						</button>
						<button type="button" className="cancel" onClick={() => setAdding(false)}>
							취소
						</button>
					</form>
				) : (
					<button type="button" className="chip add" onClick={() => setAdding(true)}>
						<LuFolderPlus aria-hidden /> 새 폴더
					</button>
				)}
			</div>
			{/* 고른 폴더 관리 */}
			{current && (
				<div className="manage">
					{renaming ? (
						<form
							className="inline-form"
							onSubmit={(event) => {
								event.preventDefault();
								const trimmed = name.trim();
								if (!trimmed || trimmed === current.name) return setRenaming(false);
								rename.mutate({ id: current.id, name: trimmed }, { onSuccess: () => setRenaming(false) });
							}}
						>
							<input
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => e.key === 'Escape' && setRenaming(false)}
								maxLength={30}
								aria-label="폴더 이름"
								autoFocus
							/>
							<button type="submit" className="save" disabled={!name.trim() || rename.isPending}>
								저장
							</button>
							<button type="button" className="cancel" onClick={() => setRenaming(false)}>
								취소
							</button>
						</form>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									setName(current.name);
									setRenaming(true);
								}}
							>
								이름 바꾸기
							</button>
							<button type="button" className="danger" onClick={() => confirmRemove(current)}>
								폴더 지우기
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}

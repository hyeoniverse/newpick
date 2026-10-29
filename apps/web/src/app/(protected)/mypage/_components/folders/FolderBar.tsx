'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { LuFolder, LuFolderPlus } from 'react-icons/lu';
import { useModal } from '@/hooks/useModal';
import { Folder, useFolderMutations } from '@/hooks/useFolders';
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
		<StyledFolderBar role="group" aria-label="폴더">
			{/* 끄는 중: 화면 위에 폴더 칸을 띄워 멀리 끌고 올라가지 않아도 놓을 수 있게 */}
			{dragging > 0 && (
				<div className="drop-dock" aria-hidden>
					<p>{dragging > 1 ? `${dragging}개를` : '여기에'} 놓을 폴더</p>
					<div className="targets">
						<div className={`target ${over === 'none' ? 'over' : ''}`} {...dropProps('none')}>
							폴더 없음
						</div>
						{folders.map((f) => (
							<div key={f.id} className={`target ${over === f.id ? 'over' : ''}`} {...dropProps(f.id)}>
								<LuFolder /> {f.name}
							</div>
						))}
						{folders.length === 0 && <span className="hint">먼저 &lsquo;새 폴더&rsquo;로 폴더를 만들어 주세요</span>}
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
		</StyledFolderBar>
	);
}

const StyledFolderBar = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;

	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		height: 2rem;
		padding: 0 0.75rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.chip};
		background: ${({ theme }) => theme.color.background};
		font: inherit;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.text};
		white-space: nowrap;
		cursor: pointer;

		svg {
			width: 0.875rem;
			height: 0.875rem;
			color: ${({ theme }) => theme.color.subText};
		}

		.count {
			color: ${({ theme }) => theme.color.subText};
			font-variant-numeric: tabular-nums;
		}

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
		}

		&[aria-pressed='true'] {
			border-color: ${({ theme }) => theme.color.primary};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};

			svg,
			.count {
				color: ${({ theme }) => theme.color.primary};
			}
		}

		&.add {
			border-style: dashed;
			color: ${({ theme }) => theme.color.primary};

			svg {
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	/* 끄는 중: 놓을 수 있는 칩 · 마우스가 올라간 칩 */
	.chip.droppable {
		border-style: dashed;
		border-color: ${({ theme }) => theme.color.primary};
	}

	.chip.over {
		border-style: solid;
		background: ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.white};

		svg,
		.count {
			color: ${({ theme }) => theme.color.white};
		}
	}

	/* 끄는 중 화면 위에 뜨는 폴더 칸 */
	.drop-dock {
		position: fixed;
		top: 5rem;
		left: 50%;
		z-index: 900;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		width: min(40rem, calc(100vw - 2rem));
		padding: 0.875rem 1rem;
		border: 1px solid ${({ theme }) => theme.color.primary};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};
		transform: translateX(-50%);

		p {
			margin: 0;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			color: ${({ theme }) => theme.color.primary};
		}

		.targets {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.target {
			display: inline-flex;
			align-items: center;
			gap: 0.375rem;
			min-height: 2.75rem;
			padding: 0 1rem;
			border: 1px dashed ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.radius.control};
			font-size: ${({ theme }) => theme.fontSize.small};
			color: ${({ theme }) => theme.color.text};

			svg {
				width: 1rem;
				height: 1rem;
				color: ${({ theme }) => theme.color.primary};
				pointer-events: none;
			}

			&.over {
				border-style: solid;
				background: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.white};

				svg {
					color: ${({ theme }) => theme.color.white};
				}
			}
		}

		.hint {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.inline-form {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;

		input {
			width: 10rem;
			height: 2rem;
			padding: 0 0.625rem;
			border: 1px solid ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.radius.chip};
			background: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.text};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};

			&:focus {
				outline: none;
			}
		}

		button {
			height: 2rem;
			padding: 0 0.75rem;
			border-radius: ${({ theme }) => theme.radius.chip};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			cursor: pointer;
		}

		.save {
			background: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.white};

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}

		.cancel {
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.manage {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};

		> button {
			padding: 0;
			font: inherit;
			color: ${({ theme }) => theme.color.subText};
			cursor: pointer;

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				text-decoration: underline;
			}

			&.danger:hover {
				color: ${({ theme }) => theme.color.error};
			}
		}
	}
`;

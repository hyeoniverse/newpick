'use client';

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { LuCheck, LuFolder, LuFolderPlus } from 'react-icons/lu';
import { useHighlightFolderMutations, useHighlightFolders } from '@/hooks/useHighlights';

interface Props {
	/** 단추 글 (예: '폴더 옮기기', '폴더로 옮기기') */
	label: string;
	/** 지금 폴더 (한 개 옮길 때 표시용, 여러 개면 생략) */
	current?: number | null;
	/** 고른 폴더 (null = 폴더 없음) */
	onPick: (folderId: number | null) => void;
	/** 메뉴를 위로 펼칠지 (화면 아래 막대에서) */
	up?: boolean;
	className?: string;
	disabled?: boolean;
}

/**
 * 스크랩 폴더 고르기 메뉴 (#123): 폴더 없음 · 내 폴더들 · 새 폴더 만들고 바로 옮기기.
 * 문장 하나의 '폴더 옮기기'와 선택 막대의 '폴더로 옮기기'가 같이 쓴다
 */
export default function FolderMenu({ label, current, onPick, up = false, className, disabled }: Props) {
	const { data: folders = [] } = useHighlightFolders();
	const { create } = useHighlightFolderMutations();
	const [open, setOpen] = useState(false);
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState('');
	const boxRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const close = (event: MouseEvent) => {
			if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
		document.addEventListener('mousedown', close);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', close);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	const pick = (folderId: number | null) => {
		setOpen(false);
		setAdding(false);
		onPick(folderId);
	};

	return (
		<StyledFolderMenu ref={boxRef} className={className} $up={up}>
			<button
				type="button"
				className="trigger"
				aria-haspopup="menu"
				aria-expanded={open}
				disabled={disabled}
				onClick={() => setOpen((v) => !v)}
			>
				{label}
			</button>
			{open && (
				<div className="menu" role="menu">
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
		</StyledFolderMenu>
	);
}

const StyledFolderMenu = styled.div<{ $up: boolean }>`
	position: relative;
	display: inline-flex;

	.menu {
		position: absolute;
		${({ $up }) => ($up ? 'bottom: calc(100% + 0.375rem);' : 'top: calc(100% + 0.375rem);')}
		left: 0;
		z-index: 30;
		display: flex;
		flex-direction: column;
		min-width: 13rem;
		max-height: 18rem;
		overflow-y: auto;
		padding: 0.375rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background: ${({ theme }) => theme.color.background};

		/* 모바일: 옆으로 미는 줄 안에서 잘리지 않게 화면 아래에 붙여 띄운다 */
		@media ${({ theme }) => theme.mediaQuery.mobile} {
			position: fixed;
			top: auto;
			right: 1rem;
			bottom: 6.5rem;
			left: 1rem;
			z-index: 1000;
			min-width: 0;
		}

		> button {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 0.625rem;
			border-radius: ${({ theme }) => theme.radius.control};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.text};
			text-align: left;
			white-space: nowrap;
			cursor: pointer;

			svg {
				flex-shrink: 0;
				width: 1rem;
				height: 1rem;
				color: ${({ theme }) => theme.color.primary};
			}

			.muted {
				color: ${({ theme }) => theme.color.subText};
			}

			.check {
				margin-left: auto;
			}

			&:hover {
				background: ${({ theme }) => theme.color.tertiary};
			}

			&.new {
				margin-top: 0.25rem;
				border-top: 1px solid ${({ theme }) => theme.color.border};
				border-radius: 0 0 ${({ theme }) => theme.radius.control} ${({ theme }) => theme.radius.control};
				padding-top: 0.625rem;
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}

	.add {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.25rem;
		padding-top: 0.5rem;
		border-top: 1px solid ${({ theme }) => theme.color.border};

		input {
			flex: 1;
			min-width: 0;
			padding: 0.375rem 0.5rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.text};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};

			&:focus {
				outline: none;
				border-color: ${({ theme }) => theme.color.primary};
			}
		}

		button {
			padding: 0.375rem 0.625rem;
			border-radius: ${({ theme }) => theme.radius.control};
			background: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.white};
			font: inherit;
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			cursor: pointer;

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}
	}
`;

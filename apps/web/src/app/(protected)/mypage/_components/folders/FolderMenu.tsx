'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { LuCheck, LuFolder, LuFolderPlus } from 'react-icons/lu';
import { useFolderMutations, useFolders } from '@/hooks/useFolders';

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
 * 폴더 고르기 메뉴 (#123): 폴더 없음 · 내 폴더들 · 새 폴더 만들고 바로 옮기기.
 * 스크랩 · 북마크 · 받은 메일의 '폴더 옮기기'와 선택 막대의 '폴더로 옮기기'가 같이 쓴다.
 * 메뉴는 페이지 맨 바깥(body)에 띄워, 카드처럼 넘치는 내용을 자르는 틀 안에서 열어도 잘리지 않게 한다
 */
export default function FolderMenu({ label, current, onPick, up = false, className, disabled }: Props) {
	const { data: folders = [] } = useFolders();
	const { create } = useFolderMutations();
	const [open, setOpen] = useState(false);
	const [adding, setAdding] = useState(false);
	const [name, setName] = useState('');
	const boxRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	// 단추 바로 아래(또는 위)에 띄울 자리
	const [place, setPlace] = useState<React.CSSProperties>({});

	useEffect(() => {
		if (!open) return;
		const close = (event: MouseEvent) => {
			const target = event.target as Node;
			if (!boxRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
		};
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
		// 화면에 붙여 띄우므로 실제로 스크롤하거나(40px 넘게) 크기가 바뀌면 닫는다 (누를 때 생기는 작은 움직임은 무시)
		const openedAt = window.scrollY;
		const dismiss = () => Math.abs(window.scrollY - openedAt) > 40 && setOpen(false);
		document.addEventListener('mousedown', close);
		document.addEventListener('keydown', onKey);
		window.addEventListener('scroll', dismiss, { passive: true });
		const onResize = () => setOpen(false);
		window.addEventListener('resize', onResize);
		return () => {
			document.removeEventListener('mousedown', close);
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', dismiss);
			window.removeEventListener('resize', onResize);
		};
	}, [open]);

	const toggle = () => {
		const rect = boxRef.current?.getBoundingClientRect();
		if (rect) {
			const left = Math.min(rect.left, window.innerWidth - 224);
			// 아래 자리가 모자라면(화면 아래쪽 카드 · 메일 줄) 위로 연다
			const openUp = up || (window.innerHeight - rect.bottom < 280 && rect.top > window.innerHeight - rect.bottom);
			setPlace(openUp ? { left, bottom: window.innerHeight - rect.top + 6 } : { left, top: rect.bottom + 6 });
		}
		setOpen((v) => !v);
	};

	const pick = (folderId: number | null) => {
		setOpen(false);
		setAdding(false);
		onPick(folderId);
	};

	return (
		<StyledFolderMenu ref={boxRef} className={className}>
			<button
				type="button"
				className="trigger"
				aria-haspopup="menu"
				aria-expanded={open}
				disabled={disabled}
				onClick={toggle}
			>
				{label}
			</button>
			{open &&
				createPortal(
					<StyledMenu ref={menuRef} className="folder-menu" role="menu" style={place}>
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
					</StyledMenu>,
					document.body,
				)}
		</StyledFolderMenu>
	);
}

const StyledFolderMenu = styled.div`
	position: relative;
	display: inline-flex;
`;

/** body에 띄우는 메뉴 (자리는 style로) */
const StyledMenu = styled.div`
	position: fixed;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	min-width: 13rem;
	max-height: 18rem;
	overflow-y: auto;
	padding: 0.375rem;
	border: 1px solid ${({ theme }) => theme.color.border};
	border-radius: ${({ theme }) => theme.radius.surface};
	background: ${({ theme }) => theme.color.background};

	/* 모바일: 화면 아래에 붙여 띄운다 (단추 옆 자리를 정한 인라인 위치보다 앞서게) */
	@media ${({ theme }) => theme.mediaQuery.mobile} {
		top: auto !important;
		right: 1rem !important;
		bottom: 6.5rem !important;
		left: 1rem !important;
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

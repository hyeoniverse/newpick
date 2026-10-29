'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { LuTriangleAlert } from 'react-icons/lu';
import ModalContents from '@/components/common/modal/ModalContent';
import InputRadio from '@/components/common/InputRadio';
import InputSelect from '@/components/common/InputSelect';
import { Folder, FolderContents } from '@/hooks/useFolders';

interface Props {
	folder: Folder;
	/** 옮길 수 있는 다른 폴더들 */
	others: Folder[];
	onCancel: () => void;
	onConfirm: (contents: FolderContents, to?: number) => void;
}

/**
 * 폴더 지우기 확인: 세 탭 공통 폴더라 안의 것(스크랩 · 북마크 · 메일)을 모두 알려 주고,
 * 폴더 없음으로 남길지 · 다른 폴더로 옮길지 · 같이 지울지 고른다. 받은 메일은 지울 수 없어 같이 지워도 남는다
 */
export default function FolderDeleteModal({ folder, others, onCancel, onConfirm }: Props) {
	const [contents, setContents] = useState<FolderContents>('keep');
	const [to, setTo] = useState(others[0] ? String(others[0].id) : '');
	const { highlights, bookmarks, mails } = folder.counts;
	const inside = [
		highlights && `스크랩 ${highlights}개`,
		bookmarks && `북마크 ${bookmarks}개`,
		mails && `메일 ${mails}통`,
	].filter(Boolean);

	if (!inside.length) {
		return (
			<ModalContents
				icon={<LuTriangleAlert />}
				title={`'${folder.name}' 폴더를 지울까요?`}
				content="빈 폴더예요."
				outlineButton="취소"
				filledButton="폴더 지우기"
				onCancelClick={onCancel}
				onConfirmClick={() => onConfirm('keep')}
			/>
		);
	}

	const erasable = [highlights && `스크랩 ${highlights}개`, bookmarks && `북마크 ${bookmarks}개`].filter(Boolean);
	return (
		<ModalContents
			icon={<LuTriangleAlert />}
			title={`'${folder.name}' 폴더를 지울까요?`}
			content={`안에 ${inside.join(' · ')}가 있어요.\n어떻게 할지 골라 주세요.`}
			outlineButton="취소"
			filledButton={contents === 'delete' ? '모두 지우기' : '폴더 지우기'}
			onCancelClick={onCancel}
			onConfirmClick={() => onConfirm(contents, contents === 'move' ? Number(to) : undefined)}
		>
			<StyledChoices>
				<InputRadio<FolderContents>
					name="folder-contents"
					label="안의 것들"
					value={contents}
					onChange={setContents}
					options={[
						{ value: 'keep', label: '폴더 없음으로 남기기' },
						// 옮길 폴더가 없으면 고를 수 없게 빼 둔다
						...(others.length ? [{ value: 'move' as const, label: '다른 폴더로 옮기기' }] : []),
						{ value: 'delete', label: '안의 것까지 모두 지우기' },
					]}
				/>
				{contents === 'move' && (
					<InputSelect
						name="folder-move-to"
						label="옮길 폴더"
						value={to}
						onChange={setTo}
						options={others.map((f) => ({ value: String(f.id), label: f.name }))}
					/>
				)}
				{contents === 'delete' && (
					<p className="warn">
						{erasable.length ? `${erasable.join(' · ')}를 지워요. 되돌릴 수 없어요.` : ''}
						{mails ? `${erasable.length ? '\n' : ''}받은 메일은 지울 수 없어 폴더 없음으로 남아요.` : ''}
					</p>
				)}
			</StyledChoices>
		</ModalContents>
	);
}

const StyledChoices = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
	text-align: left;

	.options {
		flex-direction: column;
		align-items: flex-start;
	}

	.warn {
		margin: 0;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.error};
	}
`;

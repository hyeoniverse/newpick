'use client';

import { useState } from 'react';
import { deleteAccount } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { useInputCheck } from '@/hooks/useInputCheck';

import styled from 'styled-components';
import { LuTriangleAlert } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';
import InputCheck from '@/components/common/InputCheck';

const CONFIRM_NAME = 'delete-account-confirm';

/** 탈퇴하면 지워지는 것 (개인정보 처리방침 "탈퇴하면 함께 파기"와 같게) */
const DELETED = [
	'프로필(이메일·이름·사진)과 로그인 정보',
	'관심 분야와 구독 (메일이 더 이상 오지 않습니다)',
	'북마크한 뉴스레터',
	'메일을 받은 기록',
];

/**
 * 마이페이지 > 뉴스레터 설정 아래의 회원 탈퇴 (#65).
 * 버튼을 누르면 지워지는 것을 보여 주는 확인 시트가 열리고, 확인을 체크해야 탈퇴할 수 있다
 */
export default function DeleteAccount() {
	const { openModal } = useModal();

	return (
		<StyledDeleteAccount>
			<div>
				<Title size="extraSmall" weight="bold">
					회원 탈퇴
				</Title>
				<Text size="small" color="subText">
					탈퇴하면 계정과 구독·북마크 기록이 모두 지워지고 되돌릴 수 없습니다. 메일만 그만 받으려면 위에서 구독을
					해지하세요.
				</Text>
			</div>
			<Button scheme="monoOutline" size="small" onClick={() => openModal(<DeleteAccountSheet />)}>
				탈퇴하기
			</Button>
		</StyledDeleteAccount>
	);
}

export function DeleteAccountSheet() {
	const { closeModal } = useModal();
	const { showToast } = useToast();
	const { resetSession } = useAuth();
	const { isChecked, setChecked } = useInputCheck(CONFIRM_NAME);
	const [isDeleting, setIsDeleting] = useState(false);

	const close = () => {
		setChecked(false);
		closeModal();
	};

	const onDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteAccount();
			setChecked(false);
			closeModal();
			resetSession();
			showToast('탈퇴했습니다. 그동안 뉴픽을 이용해 주셔서 고맙습니다.', 'success');
		} catch {
			showToast('탈퇴하지 못했습니다. 잠시 뒤 다시 시도해 주세요.', 'error');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<StyledSheet>
			<span className="icon" aria-hidden>
				<LuTriangleAlert />
			</span>
			<Title size="extraSmall" weight="bold">
				정말 탈퇴할까요?
			</Title>
			<Text size="small" color="subText">
				아래 정보가 바로 지워지며 되돌릴 수 없습니다.
			</Text>
			<ul>
				{DELETED.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
			<InputCheck name={CONFIRM_NAME} label="위 내용을 확인했습니다" size="medium" />
			<div className="buttons">
				<Button scheme="outline" size="medium" onClick={close}>
					취소
				</Button>
				<Button scheme="danger" size="medium" disabled={!isChecked} isLoading={isDeleting} onClick={onDelete}>
					탈퇴하기
				</Button>
			</div>
		</StyledSheet>
	);
}

const StyledDeleteAccount = styled.section`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1.5rem;
	margin-top: 4rem;
	padding-top: 2rem;
	border-top: 1px solid ${({ theme }) => theme.color.border};

	> div {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		word-break: keep-all;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-direction: column;
		align-items: flex-start;
	}
`;

const StyledSheet = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	text-align: center;
	word-break: keep-all;

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: ${({ theme }) => theme.borderRadius.circle};
		background: color-mix(in srgb, ${({ theme }) => theme.color.error} 15%, transparent);
		color: ${({ theme }) => theme.color.error};

		svg {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	ul {
		width: 100%;
		margin: 0.25rem 0;
		padding: 1rem 1rem 1rem 2rem;
		border-radius: ${({ theme }) => theme.borderRadius.medium};
		background: ${({ theme }) => theme.color.surface};
		text-align: left;
		font-size: ${({ theme }) => theme.fontSize.small};
		line-height: 1.8;
		color: ${({ theme }) => theme.color.text};
	}

	.buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		width: 100%;
		margin-top: 0.5rem;

		button {
			width: 100%;
		}
	}
`;

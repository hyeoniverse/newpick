'use client';

import { ACCOUNT, ACTIONS } from '@/copy';
import { useState } from 'react';
import { deleteAccount } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { useInputCheck } from '@/hooks/useInputCheck';

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
		<section className="np-mypage-delete-account-delete-account">
			<div>
				<Title size="extraSmall" weight="bold">
					회원 탈퇴
				</Title>
				<Text size="small" color="subText">
					{ACCOUNT.delete.lead}
				</Text>
			</div>
			<Button scheme="monoOutline" size="small" onClick={() => openModal(<DeleteAccountSheet />)}>
				탈퇴하기
			</Button>
		</section>
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
			showToast(ACCOUNT.delete.done, 'success');
		} catch {
			showToast(ACCOUNT.delete.failed, 'error');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="np-mypage-delete-account-sheet">
			<span className="icon" aria-hidden>
				<LuTriangleAlert />
			</span>
			<Title size="extraSmall" weight="bold">
				{ACCOUNT.delete.title}
			</Title>
			<Text size="small" color="subText">
				{ACCOUNT.delete.body}
			</Text>
			<ul>
				{DELETED.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
			<InputCheck name={CONFIRM_NAME} label={ACCOUNT.delete.confirmCheck} size="medium" />
			<div className="buttons">
				<Button scheme="outline" size="medium" onClick={close}>
					{ACTIONS.cancel}
				</Button>
				<Button scheme="danger" size="medium" disabled={!isChecked} isLoading={isDeleting} onClick={onDelete}>
					탈퇴하기
				</Button>
			</div>
		</div>
	);
}

'use client';

import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import { CATEGORIES } from '@/constants/categories';
import { useInputCheck } from '@/hooks/useInputCheck';
import useSelectInterests from '@/hooks/useSelectInterests';

import styled from 'styled-components';
import { LuMailCheck, LuMailX } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import InputCheck from '@/components/common/InputCheck';
import Modal from '@/components/common/modal/Modal';
import ModalContents from '@/components/common/modal/ModalContents';
import useSubscribe from '@/hooks/useSubscribe';
import Title from '@/components/common/Title';

const StartSubscription = () => {
	const {
		status: isSubscribed,
		validateSubscribe,
		handleStart: startSubscription,
		handleCancel: cancelSubscription,
		startMutation,
		updateMutation,
		cancelMutation,
	} = useSubscribe();
	const { isChecked, setChecked } = useInputCheck('mypage-agreement');
	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const { isOpen, modalType, openModal, closeModal } = useModal();

	const handleStart = () => {
		const isValid = validateSubscribe({ selectedInterests, isChecked });
		if (isValid) {
			const isSuccess = startSubscription(selectedInterests);

			console.log('isSuccess:', isSuccess);
			if (isSuccess) {
				openModal('submit-start');
				setChecked(false);
			}
		}
	};

	const handleCancel = () => {
		cancelSubscription();
		closeModal();
	};

	return (
		<StyeldStartSubscription>
			<div className="description">
				<div className="title">
					<Title size="extraSmall" weight="semiBold">
						뉴스레터 설정
					</Title>
					{isSubscribed !== null && (
						<Button
							type="submit"
							scheme="danger"
							size="small"
							onClick={() => openModal('submit-cancel')}
							disabled={cancelMutation.isPending}
						>
							구독 해지
						</Button>
					)}
				</div>
				<Text size="small" color="subText">
					구독할 괌심사를 선택한 후 완료 버튼을 눌러주세요.
					<br />
					{isSubscribed !== null && '내일 보내드리는 뉴스레터부터 적용됩니다.'}
				</Text>
			</div>
			<div className="category-section">
				<div className="all-category">
					<Button
						type="button"
						scheme="default"
						className={
							selectedInterests.length === CATEGORIES.length ? 'active category-btn' : 'category-btn'
						}
						onClick={() => handleSelectInterests(CATEGORIES[0])}
					>
						전체
					</Button>
				</div>
				<div className="bar" />
				<ul className="categories">
					{CATEGORIES.slice(1).map((category, index) => (
						<li key={index}>
							<Button
								type="button"
								scheme="default"
								onClick={() => {
									handleSelectInterests(category);
								}}
								className={
									selectedInterests.includes(category.title) ? 'category-btn active' : 'category-btn'
								}
							>
								{category.title}
							</Button>
						</li>
					))}
				</ul>
			</div>
			{isSubscribed === null && (
				<div className="subscription-agreement">
					<InputCheck name="mypage-agreement" />
					<Text size="extraSmall">
						<Text size="extraSmall" weight="semiBold" color="primary">
							[필수]&nbsp;
						</Text>
						NewPick의&nbsp;
						<Link href="/privacy">이용약관</Link>&nbsp;
						<Link href="/privacy">개인정보처리방침</Link>&nbsp;에 동의합니다.
					</Text>
				</div>
			)}
			<div className="btn">
				<Button
					type="submit"
					scheme="primary"
					size="large"
					onClick={handleStart}
					disabled={startMutation.isPending || updateMutation.isPending}
				>
					{isSubscribed === false ? '재시작' : '완료'}
				</Button>
			</div>
			{/*모달*/}
			{isOpen && modalType === 'submit-start' && (
				<Modal isOpen={isOpen} onClose={closeModal}>
					<ModalContents
						icon={<LuMailCheck />}
						title="구독 설정이 완료되었습니다"
						content={`내일부터 새로운 뉴스레터를 보내드려요.`}
						filledButton="확인"
						onConfirmClick={closeModal}
					/>
				</Modal>
			)}
			{isOpen && modalType === 'submit-cancel' && (
				<Modal isOpen={isOpen} onClose={closeModal}>
					<ModalContents
						icon={<LuMailX />}
						title="구독을 해지하면 구독과 관련된 모든 정보가 삭제됩니다."
						content="정말로 해지하시겠습니까?"
						outlineButton="취소"
						onCancelClick={closeModal}
						filledButton="확인"
						onConfirmClick={handleCancel}
					/>
				</Modal>
			)}
		</StyeldStartSubscription>
	);
};

const StyeldStartSubscription = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2rem;

	.description {
		display: flex;
		flex-direction: column;

		.title {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin: 0;
			margin-bottom: 0.5rem;
			padding: 0;
		}
	}

	.category-section {
		display: flex;
		flex-direction: row;
		gap: 0.875rem;
		background-color: ${({ theme }) => theme.color.surface};
		padding: 2rem;
		border-top: 1px solid ${({ theme }) => theme.color.text};
		border-bottom: 1px solid ${({ theme }) => theme.color.text};

		.bar {
			border-left: 1px solid ${({ theme }) => theme.color.lightGrey};
			height: auto;
		}

		.categories {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.category-btn {
			width: max-content;
			color: ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
			border: 1px solid ${({ theme }) => theme.color.primary};
		}

		.active {
			color: ${({ theme }) => theme.color.background};
			background-color: ${({ theme }) => theme.color.primary};
			border-radius: ${({ theme }) => theme.borderRadius.capsule};
		}
	}

	.btn {
		display: flex;
		justify-content: center;
		align-items: center;

		button {
			width: 14rem;
		}
	}

	.subscription-agreement {
		display: flex;
		justify-content: flex-start;
		align-items: top;
		gap: 0.5rem;
		margin-top: 0.5rem;
		line-height: 1.5;
		white-space: normal;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		text-align: left;

		a {
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.bold};

			&:hover {
				text-decoration: underline;
			}
		}
	}
`;

export default StartSubscription;

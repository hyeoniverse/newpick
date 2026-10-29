'use client';

import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';

import styled from 'styled-components';
import { LuMailCheck, LuMailX } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import ModalContent from '@/components/common/modal/ModalContent';
import useSubscribe from '@/hooks/useSubscribe';
import Title from '@/components/common/Title';
import { mapIdToTitle } from '@/utils/mapInterests';
import ArgreementCheck from '@/components/common/article/AgreementCheck';

export default function StartSubscription() {
	const { user } = useAuth();
	const {
		status: isSubscribed = user?.isSubscribed,
		isChanging: isChangingSubscription,
		handleSubscribe: startSubscription,
		handleCancel: cancelSubscription,
	} = useSubscribe();
	const initialInterests = mapIdToTitle(user?.interests ?? []);
	const { selectedInterests = initialInterests || [], handleSelectInterests } = useSelectInterests();
	const checkName = 'mypage-agreement';
	const { isChecked, setChecked } = useInputCheck(checkName);
	const { openModal, closeModal } = useModal();

	const handleSubscribe = async () => {
		const isSuccess = await startSubscription({ interests: selectedInterests, isChecked: isChecked });

		if (isSuccess) {
			openModal(
				<ModalContent
					icon={<LuMailCheck />}
					title="구독 설정이 완료되었습니다"
					content={`내일부터 새로운 뉴스레터를 보내드려요.`}
					filledButton="확인"
					onConfirmClick={closeModal}
				/>
			);
			setChecked(false);
		}
	};

	const handleCancel = async () => {
		await cancelSubscription();
		handleSelectInterests();
		closeModal();
	};

	return (
		<StyeldStartSubscription>
			<div className="description">
				<div className="title">
					<Title size="extraSmall" weight="bold">
						뉴스레터 설정
					</Title>
					{isSubscribed !== null && (
						<Button
							type="submit"
							// 탈퇴하기와 같은 무게로: 빨간 꽉 찬 단추가 화면에서 가장 눈에 띄지 않게
							scheme="monoOutline"
							size="small"
							onClick={() =>
								openModal(
									<ModalContent
										icon={<LuMailX />}
										title={`구독을 해지하면 구독과 관련된\n모든 정보가 삭제됩니다.`}
										content="정말로 해지하시겠습니까?"
										outlineButton="확인"
										onCancelClick={handleCancel}
										filledButton="취소"
										onConfirmClick={closeModal}
									/>
								)
							}
							disabled={isChangingSubscription}
						>
							구독 해지
						</Button>
					)}
				</div>
				<Text size="small" color="subText">
					구독할 관심사를 선택한 후 완료 버튼을 눌러주세요.
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
									selectedInterests.includes(category.name) ? 'category-btn active' : 'category-btn'
								}
							>
								{category.name}
							</Button>
						</li>
					))}
				</ul>
			</div>
			<ArgreementCheck name={checkName} />
			<div className="btn">
				<Button
					type="submit"
					scheme="primary"
					size="medium"
					onClick={handleSubscribe}
					disabled={isChangingSubscription}
				>
					{isSubscribed === false ? '구독 다시 시작' : '완료'}
				</Button>
			</div>
		</StyeldStartSubscription>
	);
}

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

	/* 관심사 고르기: 얇은 테두리 상자 안에 칩 (목록 탭의 거르기 칩과 같은 모양) */
	.category-section {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid ${({ theme }) => theme.color.border};
		border-radius: ${({ theme }) => theme.radius.surface};
		background-color: ${({ theme }) => theme.color.surface};

		.bar {
			align-self: stretch;
			border-left: 1px solid ${({ theme }) => theme.color.border};
		}

		.categories {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}

		.category-btn {
			width: max-content;
			height: 2.25rem;
			padding: 0 1rem;
			border: 1px solid ${({ theme }) => theme.color.border};
			border-radius: ${({ theme }) => theme.radius.chip};
			background-color: ${({ theme }) => theme.color.background};
			color: ${({ theme }) => theme.color.text};
			font-size: ${({ theme }) => theme.fontSize.small};

			&:hover {
				border-color: ${({ theme }) => theme.color.primary};
				color: ${({ theme }) => theme.color.primary};
			}
		}

		.active,
		.active:hover {
			border-color: ${({ theme }) => theme.color.primary};
			background-color: ${({ theme }) => theme.color.primary};
			color: #ffffff;
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			flex-direction: column;
			align-items: flex-start;
			padding: 1rem;

			.bar {
				display: none;
			}
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
		width: 100%;
		display: inline-flex;
		align-items: top;
		gap: 0.5rem;
		margin-top: 0.5rem;
		line-height: 1.5;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};
		color: ${({ theme }) => theme.color.subText};
		text-align: left;

		input {
			display: inline-flex;
			vertical-align: middle;
		}

		span {
			display: inline-flex;
			vertical-align: middle;
			span {
				white-space: nowrap;
			}
		}

		a {
			color: ${({ theme }) => theme.color.primary};
			font-weight: ${({ theme }) => theme.fontWeight.bold};

			&:hover {
				text-decoration: underline;
			}
		}
	}
`;

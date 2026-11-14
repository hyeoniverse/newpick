'use client';

import { ACTIONS, SUBSCRIPTION } from '@/copy';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';

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
					title={SUBSCRIPTION.done.title}
					content={SUBSCRIPTION.done.body}
					filledButton={ACTIONS.confirm}
					onConfirmClick={closeModal}
				/>,
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
		<div className="np-mypage-start-subscription-styeld-start-subscription">
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
										title={SUBSCRIPTION.cancelConfirm.title}
										content={SUBSCRIPTION.cancelConfirm.body}
										outlineButton={ACTIONS.confirm}
										onCancelClick={handleCancel}
										filledButton={ACTIONS.cancel}
										onConfirmClick={closeModal}
									/>,
								)
							}
							disabled={isChangingSubscription}
						>
							구독 해지
						</Button>
					)}
				</div>
				<Text size="small" color="subText">
					{SUBSCRIPTION.pickThenDone}
					<br />
					{isSubscribed !== null && SUBSCRIPTION.appliesTomorrow}
				</Text>
			</div>
			<div className="category-section">
				{/* 전체 · 구분선 · 관심사를 한 줄바꿈 흐름에: 넘치면 다음 줄은 구분선 뒤가 아니라 맨 왼쪽(전체 아래)부터 */}
				<ul className="categories">
					<li>
						<Button
							type="button"
							scheme="default"
							className={selectedInterests.length === CATEGORIES.length ? 'active category-btn' : 'category-btn'}
							onClick={() => handleSelectInterests(CATEGORIES[0])}
						>
							전체
						</Button>
					</li>
					<li className="bar" aria-hidden />
					{CATEGORIES.slice(1).map((category, index) => (
						<li key={index}>
							<Button
								type="button"
								scheme="default"
								onClick={() => {
									handleSelectInterests(category);
								}}
								className={selectedInterests.includes(category.name) ? 'category-btn active' : 'category-btn'}
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
		</div>
	);
}

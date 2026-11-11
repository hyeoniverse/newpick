'use client';

import { useModal } from '@/hooks/useModal';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';
import useSubscribe from '@/hooks/useSubscribe';

import { LuMailCheck } from 'react-icons/lu';
import Text from '@/components/common/Text';
import CategoryTags from '@/components/common/article/CategoryTags';
import Button from '@/components/common/Button';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import ModalContent from '@/components/common/modal/ModalContent';
import BorderTitle from '@/components/common/BorderTitle';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
}

function WhyNewpickSection({ className }: Props) {
	const { openModal, closeModal } = useModal();
	const checkName = 'about-agreement';
	const { isChecked, setChecked } = useInputCheck(checkName);
	const { isChanging: isChangingSubscription, handleSubscribe: startSubscription } = useSubscribe();
	const { selectedInterests } = useSelectInterests();

	const handleSubscribe = async () => {
		const isSuccess = await startSubscription({ interests: selectedInterests, isChecked: isChecked });

		if (isSuccess) {
			openModal(
				<ModalContent
					icon={<LuMailCheck />}
					title="구독 설정이 완료됐어요"
					content={`내일부터 새로운 뉴스레터를 보내 드릴게요.`}
					filledButton="확인"
					onConfirmClick={closeModal}
				/>,
			);
			setChecked(false);
		}
	};

	return (
		<div data-track-section="about-explore" className={cx('np-about-explore-section-explore-section', className)}>
			<BorderTitle text="EXPLORE" />
			<div>
				<Text size="medium" color="mediumGrey" className="sub-text">
					분야를 나눠 관심사를 고르면
					<br />더 다양한 소식을 만날 수 있어요.
				</Text>
			</div>
			<div className="subscription">
				<CategoryTags className="categories" />
				<Text size="medium" weight="bold">
					평소 관심 있던 분야를 골라 보세요.
				</Text>
				<ArgreementCheck className="agreement" name={checkName} />
				<Button
					type="submit"
					size="medium"
					scheme="primary"
					className="submit"
					onClick={handleSubscribe}
					disabled={isChangingSubscription}
				>
					구독하기
				</Button>
			</div>
		</div>
	);
}

export default WhyNewpickSection;

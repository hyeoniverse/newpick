'use client';

import { ABOUT, ACTIONS, HOME } from '@/copy';
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
					title={HOME.subscribed.title}
					content={HOME.subscribed.body}
					filledButton={ACTIONS.confirm}
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
					{ABOUT.explore.lead}
					<br />
					{ABOUT.explore.more}
				</Text>
			</div>
			<div className="subscription">
				<CategoryTags className="categories" />
				<Text size="medium" weight="bold">
					{ABOUT.explore.pick}
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

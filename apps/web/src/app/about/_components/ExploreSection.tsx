'use client';

import { ABOUT, HOME } from '@/copy';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';
import { useSubscribeFlow } from '@/hooks/useSubscribeFlow';

import Text from '@/components/common/Text';
import CategoryTags from '@/components/common/article/CategoryTags';
import Button from '@/components/common/Button';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import BorderTitle from '@/components/common/BorderTitle';
import { cx } from '@/styles/tw';

interface Props {
	className?: string;
}

function ExploreSection({ className }: Props) {
	const checkName = 'about-agreement';
	const { isChecked, setChecked } = useInputCheck(checkName);
	const { isChanging: isChangingSubscription, subscribe } = useSubscribeFlow(HOME.subscribed);
	const { selectedInterests } = useSelectInterests();

	const handleSubscribe = async () => {
		if (await subscribe({ interests: selectedInterests, isChecked: isChecked })) setChecked(false);
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

export default ExploreSection;

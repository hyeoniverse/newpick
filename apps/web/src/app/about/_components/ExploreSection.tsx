'use client';

import { useModal } from '@/hooks/useModal';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';
import useSubscribe from '@/hooks/useSubscribe';

import styled from 'styled-components';
import { LuMailCheck } from 'react-icons/lu';
import Text from '@/components/common/Text';
import CategoryTags from '@/components/common/article/CategoryTags';
import Button from '@/components/common/Button';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import ModalContent from '@/components/common/modal/ModalContent';
import BorderTitle from '@/components/common/BorderTitle';

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
					title="구독 설정이 완료되었습니다"
					content={`내일부터 새로운 뉴스레터를 보내드려요.`}
					filledButton="확인"
					onConfirmClick={closeModal}
				/>
			);
			setChecked(false);
		}
	};

	return (
		<StyledExploreSection className={className}>
			<BorderTitle text="EXPLORE" />
			<div>
				<Text size="small" color="mediumGrey" className="sub-text">
					다양한 카테고리로 관심사를 더욱 세분화하여
					<br />
					확장된 경험과 지식을 보여드립니다.
				</Text>
			</div>
			<div className="subscription">
				<CategoryTags className="categories" />
				<Text size="small" weight="bold">
					평소에 관심있던 카테고리를 선택해보세요.
				</Text>
				<ArgreementCheck className="agreement" name={checkName} />
				<Button
					type="submit"
					size="medium"
					scheme="primary"
					style={{
						margin: '1rem',
						borderRadius: '0.5rem',
					}}
					onClick={handleSubscribe}
					disabled={isChangingSubscription}
				>
					구독하기
				</Button>
			</div>
		</StyledExploreSection>
	);
}

const StyledExploreSection = styled.div`
	.title-section {
		display: flex;
		align-items: center;
		margin-bottom: 3rem;

		.title {
			width: 20rem;
		}

		.bar {
			border-bottom: 1px solid ${({ theme }) => theme.color.text};
			color: ${({ theme }) => theme.color.text};
			width: 100%;
			height: fit-content;
		}
	}

	.sub-text {
		line-height: 1.8;
		margin-bottom: 8rem;
	}

	.design-text {
		font-size: 5.5rem;
		font-weight: 800;
		color: ${({ theme }) => theme.color.neutral};
		letter-spacing: 10px;
		justify-self: center;
		margin-bottom: 2rem;
	}

	.subscription {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.agreement {
			justify-content: center;
		}

		.categories {
			margin: 2rem auto;
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			align-items: center;

			button {
				width: calc((100% - 7rem) / 7);
				min-width: 5rem;
				aspect-ratio: 2.3/1;
				font-size: ${({ theme }) => theme.fontSize.large};
			}
		}
	}
`;

export default WhyNewpickSection;

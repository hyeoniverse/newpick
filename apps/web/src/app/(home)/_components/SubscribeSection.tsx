'use client';

import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { CATEGORIES } from '@/constants/categories';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useSelectInterests } from '@/hooks/useInterests';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import CardSlider from '@/components/common/slider/CardSlider';

import ModalContents from '@/components/common/modal/ModalContent';
import { BiCheck, BiPlus } from 'react-icons/bi';
import { LuMailCheck } from 'react-icons/lu';
import { useModal } from '@/hooks/useModal';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import FullWidthPanel from '@/components/common/FullWidthPanel';

interface Props {
	trends: IArticleSummary[];
}

const SubscribeSection = ({ trends }: Props) => {
	const { isChanging: isChangingSubscription, handleSubscribe: startSubscription } = useSubscribe();

	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const checkName = 'home-agreement';
	const { isChecked } = useInputCheck(checkName);
	const { openModal, closeModal } = useModal();

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault();
		const isSuccess = await startSubscription({ interests: selectedInterests, isChecked: isChecked });

		if (isSuccess) {
			openModal(
				<ModalContents
					icon={<LuMailCheck />}
					title="구독 설정이 완료되었습니다"
					content={`내일부터 새로운 뉴스레터를 보내드려요.`}
					filledButton="확인"
					onConfirmClick={closeModal}
				/>
			);
		}
	};

	if (!trends) return null;

	return (
		<StyledSubscribe>
			<FullWidthPanel>
				<Title size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터를 시작해보세요
				</Title>
			</FullWidthPanel>

			<div className="content">
				<CardSlider
					className="quick-subscription"
					type="sub"
					data={CATEGORIES.map((category) => {
						// 카테고리 이름이 '전체'인 경우 기본 이미지를 사용.
						const image =
							category.name === '전체'
								? '/img/category_all-2.jpg'
								: trends.find((trend) => trend.categoryName === category.name)?.image ||
								  '/img/newpick_default_img.jpg';

						return {
							id: category.id ?? 0,
							url: `/articles` + (category.id !== 0 ? `?categoryId=${category.id}` : ''),
							image,
							header: category.name,
							main: {
								title: undefined,
								description: `${category.name} 분야의 최신 뉴스레터를 구독하세요.`,
							},
							footer: (
								<Button
									key={category.id}
									scheme={selectedInterests.includes(category.name) ? 'primary' : 'outline'}
									onClick={() => handleSelectInterests(category)}
									icon={selectedInterests.includes(category.name) ? <BiCheck /> : <BiPlus />}
									style={{
										width: '100%',
									}}
									disabled={isChangingSubscription}
								>
									{selectedInterests.includes(category.name) ? <>Selected</> : <>Select</>}
								</Button>
							),
						};
					})}
				/>

				<div className="subscription-form">
					<Title size="medium" weight="bold">
						주요 분야 빠른 구독하기
					</Title>
					<Text size="small">선택한 분야를 이메일로 보내드릴게요.</Text>
					<div className="main">
						<Button
							type="submit"
							scheme="primary"
							style={{
								width: '100%',
								marginTop: '0.5rem',
							}}
							onClick={handleSubscribe}
							disabled={isChangingSubscription}
						>
							구독 신청
						</Button>
					</div>
					<ArgreementCheck name={checkName} />
				</div>
			</div>
		</StyledSubscribe>
	);
};

const StyledSubscribe = styled.section`
	width: 100%;
	display: flex;
	flex-direction: column;
	margin-top: 6rem;
	margin-bottom: 4rem;

	.content {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 2rem;
	}

	.subscription-form {
		width: fit-content;
		height: fit-content;
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		.main {
			display: flex;
			justify-content: flex-start;
			align-items: center;
		}

		@media ${({ theme }) => theme.mediaQuery.tablet} {
			width: 100%;
		}
	}

	.quick-subscription {
		@media ${({ theme }) => theme.mediaQuery.tablet} {
			.card {
				min-width: calc(50% - 0.9rem);
			}
		}

		@media ${({ theme }) => theme.mediaQuery.mobile} {
			.card {
				min-width: calc(100% - 0.9rem);
			}
		}
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		flex-wrap: wrap;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;
	}
`;

export default SubscribeSection;

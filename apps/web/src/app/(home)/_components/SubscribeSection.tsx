'use client';

import Link from 'next/link';
import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { CATEGORIES } from '@/constants/categories';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSubscribe } from '@/hooks/useSubscribe';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import InputCheck from '@/components/common/InputCheck';
import CardSlider from '@/components/common/slider/CardSlider';
import { BiCheck, BiPlus } from 'react-icons/bi';
import useSelectInterests from '@/hooks/useSelectInterests';

import ModalContents from '@/components/common/modal/ModalContent';
import { LuMailCheck } from 'react-icons/lu';
import { useModal } from '@/hooks/useModal';

interface Props {
	trends: IArticleSummary[];
}

const SubscribeSection = ({ trends }: Props) => {
	const {
		status: isSubscribed,
		isChanging: isChangingSubscription,
		handleSubscribe: startSubscription,
	} = useSubscribe();
	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const { isChecked } = useInputCheck('home-agreement');
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
			<CardSlider
				className="quick-subscription"
				type="sub"
				data={CATEGORIES.map((category) => {
					// 카테고리 이름이 '전체'인 경우 기본 이미지를 사용.
					const image =
						category.name === '전체'
							? '/img/newpick_default_img.jpg'
							: trends.find((trend) => trend.categoryName === category.name)?.image ||
							  '/img/newpick_default_img.jpg';

					return {
						id: category.id ?? 0,
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
				<div className="subscription-agreement">
					{isSubscribed === null ? (
						<>
							<InputCheck
								className="agreement-check"
								name="home-agreement"
								disabled={isChangingSubscription || isSubscribed !== null}
							/>
							<div className="agreement-text">
								<Text size="extraSmall" weight="semiBold" color="primary">
									[필수]&nbsp;
								</Text>
								<Text size="extraSmall">NewPick의&nbsp;</Text>
								<Link href="/privacy">이용약관</Link>&nbsp;
								<Link href="/privacy">개인정보처리방침</Link>
								<Text size="extraSmall">에 동의합니다.</Text>
							</div>
						</>
					) : (
						<>
							<Text size="extraSmall" weight="semiBold" color="primary">
								이미 약관에 동의하셨습니다.
							</Text>
						</>
					)}
				</div>
			</div>
		</StyledSubscribe>
	);
};

const StyledSubscribe = styled.section`
	width: 100%;
	display: flex;
	gap: 2rem;
	margin: 4rem auto;

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

import Link from 'next/link';
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

const SubscribeSection = () => {
	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const { validateSubscribe, handleStart: startSubscription, isChanging: isChangingSubscription } = useSubscribe();
	const { isChecked } = useInputCheck('subscribe-agreement');

	const handleSubscribe = (e: React.FormEvent) => {
		e.preventDefault();
		const isValid = validateSubscribe({ selectedInterests, isChecked });

		if (isValid) {
			startSubscription(selectedInterests);
		}
	};

	return (
		<StyledSubscribe>
			<CardSlider
				type="sub"
				data={CATEGORIES.map((category) => ({
					id: category.id ?? 0,
					image: `https://picsum.photos/400/300?random=${category.id}`,
					header: category.title,
					main: {
						title: undefined,
						description: `${category.title} 분야의 최신 뉴스레터를 구독하세요.`,
					},
					footer: (
						<Button
							key={category.id}
							scheme={selectedInterests.includes(category.title) ? 'primary' : 'outline'}
							onClick={() => handleSelectInterests(category)}
							icon={selectedInterests.includes(category.title) ? <BiCheck /> : <BiPlus />}
							style={{
								width: '100%',
							}}
							disabled={isChangingSubscription}
						>
							{selectedInterests.includes(category.title) ? <>Selected</> : <>Select</>}
						</Button>
					),
				}))}
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
					<InputCheck name="home-agreement" />
					<Text size="extraSmall">
						<Text size="extraSmall" weight="semiBold" color="primary">
							[필수]&nbsp;
						</Text>
						NewPick의&nbsp;
						<Link href="/privacy">이용약관</Link>&nbsp;
						<Link href="/privacy">개인정보처리방침</Link>&nbsp;에 동의합니다.
					</Text>
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
		flex-wrap: wrap;

		.subscription-category {
			width: 100%;

			.subscription-cards .card {
				min-width: calc(50% - 0.9rem);
			}
		}

		.subscription-form {
			width: 100%;
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		flex-wrap: wrap;

		.subscription-category {
			width: 100%;

			.subscription-cards .card {
				min-width: calc(100% - 0.9rem);
			}
		}

		.subscription-form {
			width: 100%;
		}
	}
`;

export default SubscribeSection;

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Category } from '@/models/category.model';
import { CATEGORIES } from '@/constants/categories';
import { useToast } from '@/hooks/useToast';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useAuth } from '@/hooks/useAuth';
import { useSubscribe } from '@/hooks/useSubscribe';

import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import InputCheck from '@/components/common/InputCheck';
import CardSlider from '@/components/common/slider/CardSlider';
import { BiCheck, BiPlus } from 'react-icons/bi';

const SubscribeSection = () => {
	const { showToast } = useToast();
	const { isChecked } = useInputCheck('subscribe-agreement');
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const { user } = useAuth();
	const { startMutation: subscribeMutation } = useSubscribe();

	const handleCategorySelect = (category: Category) => {
		if (category.title === '전체') {
			if (selectedCategories.includes('전체')) {
				setSelectedCategories([]);
			} else {
				setSelectedCategories(CATEGORIES.map((cat) => cat.title));
			}
		} else {
			const updatedCategories = selectedCategories.includes(category.title)
				? selectedCategories.filter((cat) => cat !== category.title)
				: [...selectedCategories, category.title];

			if (updatedCategories.includes('전체') && !updatedCategories.includes(category.title)) {
				setSelectedCategories(updatedCategories.filter((cat) => cat !== 'all') as string[]);
			} else if (updatedCategories.length === CATEGORIES.length - 1) {
				setSelectedCategories(CATEGORIES.map((cat) => cat.name));
			} else {
				setSelectedCategories(updatedCategories);
			}
		}
	};

	useEffect(() => {
		console.log('selectedCategories:', selectedCategories);

		if (user?.interests?.length) {
			console.log('interests:', user.interests);
			setSelectedCategories(user.interests);
		}
	}, [user?.interests, selectedCategories]);

	const validateSubscribe = () => {
		if (!user) {
			showToast('로그인이 필요합니다.', 'info');
			return false;
		}

		if (!user.id) {
			console.error('❌ 유효하지 않은 userId:', user.id);
			showToast('로그인 정보를 불러올 수 없습니다.', 'error');
			return false;
		}

		if (user.isSubscribed === true) {
			showToast('이미 구독 중입니다.', 'warning'); // 관심사 기능이 구현되면 해당 관심사에 대해서만 이 에러 발생
			return false;
		}

		if (selectedCategories.length === 0) {
			showToast('최소 한 개의 카테고리를 선택해야 합니다.', 'warning');
			return false;
		}

		if (!isChecked) {
			showToast('약관에 동의해야 구독할 수 있습니다.', 'warning');
			return false;
		}

		return true;
	};

	const handleSubscribe = (e: React.FormEvent) => {
		e.preventDefault();
		const formCompleted = validateSubscribe();

		if (formCompleted) {
			subscribeMutation.mutate(
				{ userId: user!.id },
				{
					onSuccess: () => showToast('구독이 완료되었습니다!', 'success'),
					onError: (error) => showToast(`구독 실패: ${error.message}`, 'error'),
				}
			);
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
							scheme={selectedCategories.includes(category.title) ? 'primary' : 'outline'}
							onClick={() => handleCategorySelect(category)}
							icon={selectedCategories.includes(category.title) ? <BiCheck /> : <BiPlus />}
							style={{
								width: '100%',
							}}
							disabled={subscribeMutation.isPending}
						>
							{selectedCategories.includes(category.title) ? <>Selected</> : <>Select</>}
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
						disabled={subscribeMutation.isPending}
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

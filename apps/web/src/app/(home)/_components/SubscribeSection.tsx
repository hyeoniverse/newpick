'use client';

import { HOME } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { CATEGORIES } from '@/constants/categories';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSubscribeFlow } from '@/hooks/useSubscribeFlow';
import { useSelectInterests } from '@/hooks/useInterests';
import { useAuth } from '@/hooks/useAuth';
import { useTrends } from '@/hooks/useTrends';

import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import CardSlider from '@/components/common/slider/CardSlider';

import { BiCheck, BiPlus } from 'react-icons/bi';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import FullWidthPanel from '@/components/common/FullWidthPanel';

const SubscribeSection = () => {
	const { user } = useAuth();
	const { trends } = useTrends();
	const { isChanging: isChangingSubscription, subscribe } = useSubscribeFlow(HOME.subscribed);

	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const checkName = 'home-agreement';
	const { isChecked } = useInputCheck(checkName);
	const openLogin = useOpenLogin();

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			openLogin(HOME.loginForSubscribe);
			return;
		}

		await subscribe({ interests: selectedInterests, isChecked: isChecked });
	};

	if (!trends) return null;

	return (
		<section className="np-home-subscribe-section-subscribe" data-track-section="home-subscribe">
			<FullWidthPanel>
				<Title as="h2" size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터 시작하기
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
								: trends.find((trend) => trend.categoryName === category.name)?.image || '/img/newpick_default_img.jpg';

						return {
							id: category.id ?? 0,
							url: category.id !== 0 ? ROUTES.articlesByCategory(category.id) : ROUTES.articles,
							image,
							header: category.name,
							main: {
								title: undefined,
								description: HOME.categoryCard(category.name),
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
					<Title as="h2" size="medium" weight="bold">
						주요 분야 빠른 구독하기
					</Title>
					<Text size="small">{HOME.quickLead}</Text>
					<div className="main">
						{/* 칸이 화면에 있는 동안 빛이 지나가며 반짝이게 (styles/pages/home.css .np-subscribe-cta) */}
						<Button
							type="submit"
							className="np-subscribe-cta"
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
		</section>
	);
};

export default SubscribeSection;

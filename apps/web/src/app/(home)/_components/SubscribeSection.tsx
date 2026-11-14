'use client';

import { ACTIONS, HOME } from '@/copy';
import { ROUTES } from '@/constants/routes';
import { CATEGORIES } from '@/constants/categories';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useSelectInterests } from '@/hooks/useInterests';
import { useAuth } from '@/hooks/useAuth';
import { useTrends } from '@/hooks/useTrends';

import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import CardSlider from '@/components/common/slider/CardSlider';

import ModalContents from '@/components/common/modal/ModalContent';
import { BiCheck, BiPlus } from 'react-icons/bi';
import { LuMailCheck } from 'react-icons/lu';
import { useModal } from '@/hooks/useModal';
import { useOpenLogin } from '@/hooks/useOpenLogin';
import ArgreementCheck from '@/components/common/article/AgreementCheck';
import FullWidthPanel from '@/components/common/FullWidthPanel';

const SubscribeSection = () => {
	const { user } = useAuth();
	const { trends } = useTrends();
	const { isChanging: isChangingSubscription, handleSubscribe: startSubscription } = useSubscribe();

	const { selectedInterests, handleSelectInterests } = useSelectInterests();
	const checkName = 'home-agreement';
	const { isChecked } = useInputCheck(checkName);
	const { openModal, closeModal } = useModal();
	const openLogin = useOpenLogin();

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) {
			openLogin(HOME.loginForSubscribe);
			return;
		}

		const isSuccess = await startSubscription({ interests: selectedInterests, isChecked: isChecked });

		if (isSuccess) {
			openModal(
				<ModalContents
					icon={<LuMailCheck />}
					title={HOME.subscribed.title}
					content={HOME.subscribed.body}
					filledButton={ACTIONS.confirm}
					onConfirmClick={closeModal}
				/>,
			);
		}
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
		</section>
	);
};

export default SubscribeSection;

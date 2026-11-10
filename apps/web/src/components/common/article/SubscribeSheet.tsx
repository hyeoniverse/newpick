'use client';

import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useInputCheck } from '@/hooks/useInputCheck';
import { useSelectInterests } from '@/hooks/useInterests';
import useSubscribe from '@/hooks/useSubscribe';
import { useInterestStore } from '@/stores/useInterestStore';

import { useEffect } from 'react';

import { cx } from '@/styles/tw';
import { LuMailCheck } from 'react-icons/lu';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';
import Title from '@/components/common/Title';
import ModalContent from '@/components/common/modal/ModalContent';
import ArgreementCheck from '@/components/common/article/AgreementCheck';

const CHECK_NAME = 'sheet-agreement';

/**
 * 기사 상세에서 바로 구독 (#52). 마이페이지로 이동하지 않고 시트에서 관심 분야 선택 · 약관 동의 · 구독까지.
 * 마이페이지 StartSubscription과 같은 훅을 쓴다. initialInterests: 체험 미리보기에서 고른 분야 (#54)
 */
export default function SubscribeSheet({ initialInterests }: { initialInterests?: string[] }) {
	const { user } = useAuth();
	const { isChanging, handleSubscribe } = useSubscribe();
	const { selectedInterests = [], handleSelectInterests } = useSelectInterests();
	const { isChecked, setChecked } = useInputCheck(CHECK_NAME);
	const { openModal, closeModal } = useModal();
	const setSelectedInterests = useInterestStore((state) => state.setSelectedInterests);

	// useSelectInterests가 user 기준으로 선택을 초기화한 뒤에 덮어써야 한다 (effect는 선언 순서대로 돈다)
	useEffect(() => {
		if (initialInterests?.length) setSelectedInterests(initialInterests);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const isAll = selectedInterests.length === CATEGORIES.length;
	// 약관 동의는 처음 구독할 때만 (일시정지했다 다시 시작하면 이미 동의함)
	const needsAgreement = user?.isSubscribed === null;
	const canSubmit = selectedInterests.length > 0 && (!needsAgreement || isChecked) && !isChanging;

	const onSubmit = async () => {
		const isSuccess = await handleSubscribe({ interests: selectedInterests, isChecked });
		if (!isSuccess) return;
		setChecked(false);
		openModal(
			<ModalContent
				icon={<LuMailCheck />}
				title="구독이 완료되었습니다"
				content="내일 아침부터 선택한 분야의 뉴스레터를 보내드립니다."
				filledButton="확인"
				onConfirmClick={closeModal}
			/>,
		);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="head flex flex-col gap-1.5">
				<Title size="small" weight="bold">
					뉴스레터 구독
				</Title>
				<Text size="small" color="subText">
					받아 볼 분야를 고르면 주요 소식만 골라 메일로 보내드립니다.
				</Text>
			</div>

			<fieldset className="categories m-0 flex flex-wrap gap-2 border-none p-0">
				<legend className="mb-3 text-small font-semi-bold text-text">관심 분야</legend>
				{CATEGORIES.map((category) => {
					const selected = category.name === '전체' ? isAll : selectedInterests.includes(category.name);
					return (
						<button
							key={category.id}
							type="button"
							className={cx(
								'chip cursor-pointer rounded-chip border border-solid px-4 py-2 text-small [transition:background_0.15s,border-color_0.15s]',
								// 같은 속성 클래스가 둘 붙지 않게 고른 · 안 고른 중 하나만
								selected
									? 'selected border-primary bg-primary font-semi-bold text-background'
									: 'border-border bg-background text-text hover:border-primary',
							)}
							aria-pressed={selected}
							onClick={() => handleSelectInterests(category)}
						>
							{category.name}
						</button>
					);
				})}
			</fieldset>

			<ArgreementCheck name={CHECK_NAME} className="agreement border-0 border-t border-solid border-border pt-4" />

			<Button
				scheme="primary"
				size="medium"
				className="submit"
				onClick={onSubmit}
				disabled={!canSubmit}
				style={{ '--btn-width': '100%', '--btn-height': '3rem' } as React.CSSProperties}
			>
				{selectedInterests.length
					? `${isAll ? '전체' : `${selectedInterests.length}개`} 분야 구독하기`
					: '분야를 골라 주십시오'}
			</Button>
		</div>
	);
}

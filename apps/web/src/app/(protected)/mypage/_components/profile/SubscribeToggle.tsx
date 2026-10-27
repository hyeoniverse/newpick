'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSubscribe } from '@/hooks/useSubscribe';
import { useModal } from '@/hooks/useModal';
import { useTab } from '@/hooks/useTab';

import styled from 'styled-components';
import { LuBell, LuBellOff } from 'react-icons/lu';
import { ToggleIcon } from '@/components/common/svg/ToggleSVG';
import ModalContents from '@/components/common/modal/ModalContent';

function SubscribeToggle() {
	const { user } = useAuth();
	const { setActiveTab } = useTab();
	const { status: isSubscribed = user?.isSubscribed, toggleSubscribe } = useSubscribe();
	const { openModal, closeModal } = useModal();

	const onToggle = () => {
		toggleSubscribe();
	};

	const handleConfirm = () => {
		closeModal();
		setActiveTab('settings');
	};

	return (
		<SubscribeToggleStyled>
			{/*구독 진행 중에 따라 노출 변경 필요*/}
			{isSubscribed === null ? (
				<>
					<button
						type="button"
						className="not-subscribe"
						onClick={() =>
							openModal(
								<ModalContents
									icon={<LuBell />}
									title="구독 상태가 아닙니다."
									content={`새롭게 뉴스레터를 구독해보시겠습니까?\n확인을 누르시면 구독페이지로 넘어갑니다.`}
									outlineButton="취소"
									filledButton="확인"
									onCancelClick={closeModal}
									onConfirmClick={handleConfirm}
								/>
							)
						}
					>
						<LuBellOff aria-hidden />
						<span>구독 상태가 아닙니다.</span>
					</button>
				</>
			) : (
				// 켜고 끄는 스위치: 키보드(Space · Enter)로도 바꾸고, 지금 상태를 화면 읽기 프로그램에 알린다 (#16)
				<button
					type="button"
					role="switch"
					aria-checked={isSubscribed === true}
					aria-label="뉴스레터 받기"
					className={isSubscribed === true ? 'subscribe-on' : 'subscribe-off'}
					onClick={onToggle}
				>
					<ToggleIcon className="svg" $toggle={isSubscribed === true} aria-hidden />
					<span aria-hidden>{isSubscribed === true ? '구독 진행중' : '구독 일시정지 중'}</span>
				</button>
			)}
		</SubscribeToggleStyled>
	);
}

const SubscribeToggleStyled = styled.div`
	.subscribe-on,
	.subscribe-off,
	.not-subscribe {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.725rem;
		padding: 1.25rem;
		border-radius: ${({ theme }) => theme.radius.surface};
		height: 3.875rem;
		width: 14rem;
		font-size: inherit;
		text-align: left;
		font-weight: ${({ theme }) => theme.fontWeight.medium};
		cursor: pointer;

		&:hover {
			color: ${({ theme }) => theme.color.primary};
			border: 1px solid ${({ theme }) => theme.color.primary};
			transition: background-color 0.5s, border-color 0.5s, color 0.5s;
		}

		.svg {
			height: 2rem;
			width: 3.25rem;
		}
	}

	.subscribe-on {
		border: 1px solid ${({ theme }) => theme.color.primary};
		color: ${({ theme }) => theme.color.primary};
		background-color: ${({ theme }) => theme.color.tertiary};
	}

	.subscribe-off {
		border: 1px solid ${({ theme }) => theme.color.border};
		color: ${({ theme }) => theme.color.text};
		background-color: ${({ theme }) => theme.color.surface};
	}

	.not-subscribe {
		border: 1px solid ${({ theme }) => theme.color.border};
		color: ${({ theme }) => theme.color.text};
		background-color: ${({ theme }) => theme.color.surface};

		svg {
			width: 1.25rem;
			height: 1.25rem;
			color: ${({ theme }) => theme.color.primary};
		}

		&:hover {
			border-color: ${({ theme }) => theme.color.primary};
			color: ${({ theme }) => theme.color.primary};
			background-color: ${({ theme }) => theme.color.tertiary};
		}
	}
`;

export default SubscribeToggle;

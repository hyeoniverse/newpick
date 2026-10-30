import { useId } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { styled } from 'styled-components';
import InputCheck from '@/components/common/InputCheck';
import Text from '@/components/common/Text';
import { LuCircleCheck } from 'react-icons/lu';

interface Props {
	name: string;
	className?: string;
}

export default function ArgreementCheck({ name, className }: Props) {
	const { user } = useAuth();
	const { status: isSubscribed = user?.isSubscribed, isChanging: isChangingSubscription } = useSubscribe();
	// 옆의 동의 문구(링크가 섞여 있어 label로 감쌀 수 없음)를 체크 상자의 이름으로 (#16)
	const textId = useId();

	return (
		<StyledAgreement className={className}>
			{isSubscribed === null ? (
				<>
					<InputCheck
						className="agreement-check"
						name={name}
						disabled={isChangingSubscription || isSubscribed !== null}
						aria-labelledby={textId}
						aria-required
					/>
					<div id={textId} className="agreement-text">
						<Text size="extraSmall" weight="semiBold" color="primary">
							[필수]&nbsp;
						</Text>
						<Text size="extraSmall">NewPick의&nbsp;</Text>
						{/* 구독 창을 닫지 않고 읽을 수 있게 새 탭으로 */}
						<Link href="/terms" target="_blank">
							이용약관
						</Link>
						&nbsp;·&nbsp;
						<Link href="/privacy" target="_blank">
							개인정보 처리방침
						</Link>
						<Text size="extraSmall">에 동의합니다.</Text>
					</div>
				</>
			) : (
				// 이미 동의한 사람: 눈에 띄는 안내 대신 회색 한 줄로 (무엇에 동의했는지 링크와 함께)
				<p className="agreed">
					<LuCircleCheck aria-hidden />
					<Link href="/terms" target="_blank">
						이용약관
					</Link>
					&nbsp;·&nbsp;
					<Link href="/privacy" target="_blank">
						개인정보 처리방침
					</Link>
					에 동의했습니다.
				</p>
			)}
		</StyledAgreement>
	);
}

const StyledAgreement = styled.div`
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

	.agreed {
		display: inline-flex;
		align-items: center;
		margin: 0;
		color: ${({ theme }) => theme.color.subText};

		svg {
			flex-shrink: 0;
			width: 0.875rem;
			height: 0.875rem;
			margin-right: 0.375rem;
			color: ${({ theme }) => theme.color.primary};
		}

		a {
			font-weight: inherit;
			color: inherit;
			text-decoration: underline;
		}
	}

	a {
		color: ${({ theme }) => theme.color.primary};
		font-weight: ${({ theme }) => theme.fontWeight.bold};

		&:hover {
			text-decoration: underline;
		}
	}
`;

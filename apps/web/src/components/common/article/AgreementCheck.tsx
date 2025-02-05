import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import useSubscribe from '@/hooks/useSubscribe';
import { styled } from 'styled-components';
import InputCheck from '@/components/common/InputCheck';
import Text from '@/components/common/Text';

interface Props {
	name: string;
	className?: string;
}

export default function ArgreementCheck({ name, className }: Props) {
	const { user } = useAuth();
	const { status: isSubscribed = user?.isSubscribed, isChanging: isChangingSubscription } = useSubscribe();

	return (
		<StyledAgreement className={className}>
			{isSubscribed === null ? (
				<>
					<InputCheck
						className="agreement-check"
						name={name}
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

	a {
		color: ${({ theme }) => theme.color.primary};
		font-weight: ${({ theme }) => theme.fontWeight.bold};

		&:hover {
			text-decoration: underline;
		}
	}
`;

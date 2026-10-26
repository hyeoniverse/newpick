import styled from 'styled-components';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';

interface ModalProps {
	icon?: React.ReactNode;
	title?: string;
	content?: string;
	outlineButton?: string;
	filledButton?: string;
	onCancelClick?: () => void; // 취소 버튼 클릭 핸들러
	onConfirmClick?: () => void; // 확인 버튼 클릭 핸들러
}

function ModalContents({
	icon,
	title,
	content,
	outlineButton,
	filledButton,
	onCancelClick,
	onConfirmClick,
}: ModalProps) {
	return (
		<ModalContentsStyled>
			<div className="contents">
				{icon && <span className="icon">{icon}</span>}
				<Title size="extraSmall" weight="bold">
					{title}
				</Title>
				{content && <Text size="small">{content}</Text>}
			</div>
			<div className="btn-section">
				{outlineButton && (
					<Button scheme="outline" size="medium" onClick={onCancelClick}>
						{outlineButton}
					</Button>
				)}
				{filledButton && (
					<Button scheme="primary" size="medium" onClick={onConfirmClick}>
						{filledButton}
					</Button>
				)}
			</div>
		</ModalContentsStyled>
	);
}

const ModalContentsStyled = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	width: 100%;
	padding-top: 0.5rem;
	white-space: pre-line;

	.contents {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;

		/* 아이콘은 연한 강조색 원 안에 */
		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3.25rem;
			height: 3.25rem;
			margin-bottom: 0.5rem;
			border-radius: ${({ theme }) => theme.borderRadius.circle};
			background: ${({ theme }) => theme.color.tertiary};
			color: ${({ theme }) => theme.color.primary};

			svg {
				width: 1.625rem;
				height: 1.625rem;
			}
		}

		span {
			line-height: 1.6;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	/* 버튼은 폭을 나눠 꽉 채운다 */
	.btn-section {
		display: flex;
		width: 100%;
		gap: 0.5rem;

		button {
			flex: 1;
			min-width: 0;
			height: 2.75rem;
			border-radius: ${({ theme }) => theme.borderRadius.medium};
		}
	}
`;

export default ModalContents;

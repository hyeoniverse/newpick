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
				{icon}
				<Title size="extraSmall" weight="semiBold">
					{title}
				</Title>
				<Text size="small">{content}</Text>
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
	justify-content: center;
	gap: 1.875rem;

	.contents {
		text-align: center;

		svg {
			width: 2rem;
			height: 2rem;
			margin-bottom: 1rem;
			color: ${({ theme }) => theme.color.primary};
		}

		span {
			white-space: pre-line;
			color: ${({ theme }) => theme.color.subText};
		}
	}

	.btn-section {
		display: flex;
		flex-direction: row;
		margin: 0 auto;
		gap: 1.25rem;

		button {
			flex: 1;
			width: 10rem;
			height: 2.875rem;
		}
	}
`;

export default ModalContents;

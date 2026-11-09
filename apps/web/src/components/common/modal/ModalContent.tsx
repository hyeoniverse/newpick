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
	/** 설명 아래 단추 위에 넣을 것 (예: 고르기 칸) */
	children?: React.ReactNode;
}

/* 버튼은 폭을 나눠 꽉 채운다. 높이는 Button의 변수로 (Button 안의 크기 규칙이 이 변수를 읽는다) */
const SPLIT = { flex: 1, minWidth: 0, '--btn-height': '2.75rem' } as React.CSSProperties;

/** 확인 창 내용: 아이콘 · 제목 · 설명, 그 아래 단추 한두 개 (시트 ModalContainer 안에 넣는다) */
function ModalContents({
	icon,
	title,
	content,
	outlineButton,
	filledButton,
	onCancelClick,
	onConfirmClick,
	children,
}: ModalProps) {
	return (
		<div className="flex w-full flex-col items-center gap-6 whitespace-pre-line pt-2">
			{/* 시트(ModalContainer)의 .modal-body와 다른 이름 (같으면 시트 모양이 안쪽에도 걸린다, #176) */}
			<div className="modal-message flex flex-col items-center gap-2 text-center">
				{icon && (
					// 아이콘은 연한 강조색 원 안에
					<span className="icon mb-2 flex size-[3.25rem] items-center justify-center rounded-full bg-tertiary leading-[1.6] text-primary [&_svg]:size-[1.625rem]">
						{icon}
					</span>
				)}
				<Title size="extraSmall" weight="bold">
					{title}
				</Title>
				{content && (
					<Text size="small" color="subText" className="leading-[1.6]">
						{content}
					</Text>
				)}
			</div>
			{children}
			<div className="btn-section flex w-full gap-2">
				{outlineButton && (
					<Button scheme="outline" size="medium" onClick={onCancelClick} style={SPLIT}>
						{outlineButton}
					</Button>
				)}
				{filledButton && (
					<Button scheme="primary" size="medium" onClick={onConfirmClick} style={SPLIT}>
						{filledButton}
					</Button>
				)}
			</div>
		</div>
	);
}

export default ModalContents;

import { IconStyled } from '@/styles/Icon';
import { ExternalGlyph } from '@/components/common/icons/Glyphs';

interface Props {
	className?: string;
}

/** 원문 보기 아이콘. 마우스를 올리면 상자는 그대로, 화살표만 나가는 쪽으로 움직인다 */
function LinkIcon({ className }: Props) {
	return (
		<IconStyled className={className} aria-label="원문 보기">
			<ExternalGlyph />
		</IconStyled>
	);
}

export default LinkIcon;

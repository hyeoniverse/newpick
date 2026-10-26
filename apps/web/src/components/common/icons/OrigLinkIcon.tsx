import { LuExternalLink } from 'react-icons/lu';
import styled from 'styled-components';
import { IconStyled } from '@/styles/Icon';

interface Props {
	className?: string;
}

/** 원문 보기 아이콘. 마우스를 올리면 화살표가 나가는 쪽(오른쪽 위)으로 살짝 움직인다 */
function LinkIcon({ className }: Props) {
	return (
		<OrigLinkStyled className={className} aria-label="원문 보기">
			<LuExternalLink />
		</OrigLinkStyled>
	);
}

const OrigLinkStyled = styled(IconStyled)`
	&:hover svg {
		transform: translate(2px, -2px);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover svg {
			transform: none;
		}
	}
`;

export default LinkIcon;

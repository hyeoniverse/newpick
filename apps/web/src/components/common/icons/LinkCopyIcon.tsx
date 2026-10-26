import { useEffect, useState } from 'react';
import { LuCheck, LuLink2 } from 'react-icons/lu';
import styled, { keyframes } from 'styled-components';
import { IconStyled } from '@/styles/Icon';
import { useToast } from '@/hooks/useToast';

interface Props {
	className?: string;
	id: string | number;
}

function LinkCopyIcon({ className, id }: Props) {
	const { showToast } = useToast();
	// 복사하면 잠깐 체크 표시로 바꿔 눌렀다는 걸 바로 보여 준다
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 1500);
		return () => clearTimeout(timer);
	}, [copied]);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			showToast('주소가 복사되었습니다.', 'success');
		} catch {
			// 권한이 없거나 보안 컨텍스트(https)가 아니면 실패합니다.
			showToast('주소를 복사하지 못했습니다.', 'error');
		}
	};

	const handleCopyClick = () => {
		const url = `${window.location.origin}/articles/detail/${id}`;
		copyToClipboard(url);
	};

	return (
		<IconStyled onClick={handleCopyClick} className={className} aria-label={copied ? '주소 복사됨' : '주소 복사'}>
			{copied ? <CopiedIcon key="copied" /> : <LuLink2 key="link" />}
		</IconStyled>
	);
}

const appear = keyframes`
	from {
		opacity: 0;
		transform: scale(0.5) rotate(-20deg);
	}
	to {
		opacity: 1;
		transform: scale(1) rotate(0);
	}
`;

/** 복사됨 표시: 체크가 돌며 나타난다 */
const CopiedIcon = styled(LuCheck)`
	animation: ${appear} 0.25s ease-out;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

export default LinkCopyIcon;

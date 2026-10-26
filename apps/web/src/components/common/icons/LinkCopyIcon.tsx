import { useEffect, useState } from 'react';
import { CheckGlyph, LinkGlyph } from '@/components/common/icons/Glyphs';
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
			{/* 마우스를 올리면 ( ) 가 벌어지고, 복사되면 체크가 그려진다 */}
			{copied ? <CheckGlyph key="copied" /> : <LinkGlyph key="link" />}
		</IconStyled>
	);
}

export default LinkCopyIcon;

import { LuLink2 } from 'react-icons/lu';
import { IconStyled } from '@/styles/Icon';
import { useToast } from '@/hooks/useToast';

interface Props {
	className?: string;
	id: string | number;
}

function LinkCopyIcon({ className, id }: Props) {
	const { showToast } = useToast();

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
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
		<IconStyled onClick={handleCopyClick} className={className}>
			<LuLink2 />
		</IconStyled>
	);
}

export default LinkCopyIcon;

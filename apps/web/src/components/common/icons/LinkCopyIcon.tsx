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
		} catch (error) {
			console.error('주소 복사 실패: ', error);
		}
	};

	const handleCopyClick = () => {
		const url = `https://newpick.site/articles/detail/${id}`;
		console.log(url);
		copyToClipboard(url);
	};

	return (
		<IconStyled onClick={handleCopyClick} className={className}>
			<LuLink2 />
		</IconStyled>
	);
}

export default LinkCopyIcon;

import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';
import { useState } from 'react';
import { IconStyled } from '@/styles/Icon';

interface Props {
	className?: string;
}

function LikeIcon({ className }: Props) {
	const [like, setLike] = useState(false);

	const handleLike = () => {
		setLike(!like);
	};

	return (
		<>
			{like ? (
				<IconStyled onClick={handleLike} className={className}>
					<IoMdHeart />
				</IconStyled>
			) : (
				<IconStyled onClick={handleLike} className={className}>
					<IoMdHeartEmpty />
				</IconStyled>
			)}
		</>
	);
}

export default LikeIcon;

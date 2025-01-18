import { IoMdHeart, IoMdHeartEmpty } from 'react-icons/io';
import { useState } from 'react';
import { IconStyled } from '@/styles/Icon';

function LikeIcon() {
	const [like, setLike] = useState(false);

	const handleLike = () => {
		setLike(!like);
	};

	return (
		<>
			{like ? (
				<IconStyled onClick={handleLike}>
					<IoMdHeart />
				</IconStyled>
			) : (
				<IconStyled onClick={handleLike}>
					<IoMdHeartEmpty />
				</IconStyled>
			)}
		</>
	);
}

export default LikeIcon;

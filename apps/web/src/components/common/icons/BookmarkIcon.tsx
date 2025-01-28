'use client'

import { useState } from "react";
import { useTheme } from 'styled-components';
import { IconStyled } from "@/styles/Icon";
import { LuBookmark } from 'react-icons/lu';

interface Props {
	className?: string;
}

function BookmarkIcon({ className }: Props) {
	const [like, setLike] = useState(false);
	const theme = useTheme();

	const handleLike = () => {
		setLike(!like);
	};

	return (
		<IconStyled onClick={handleLike} className={className}>
			<LuBookmark
				style={{
					fill: like ? theme.color.primary : "",
				}}
			/>
		</IconStyled>
	);
}

export default BookmarkIcon;
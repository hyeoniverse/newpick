'use client';

import Link from 'next/link';
import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';

interface Props {
	type: 'unauthorized' | 'not-found';
}

const Error = ({ type }: Props) => {
	const errorMessage = type === 'unauthorized' ? '권한이 없습니다.' : '페이지를 찾을 수 없습니다.';

	return (
		<StyledError>
			<Title size="large" color="error">
				{errorMessage}
			</Title>
			<Link href="/">
				<Button size="medium" scheme="primary">
					홈으로 돌아가기
				</Button>
			</Link>
		</StyledError>
	);
};

const StyledError = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 2rem auto;
	height: 100%;
	gap: 2rem;
`;

export default Error;

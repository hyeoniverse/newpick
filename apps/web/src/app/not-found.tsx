'use client';

import Link from 'next/link';
import styled from 'styled-components';
import Button from '@/components/common/Button';
import Title from '@/components/common/Title';

export default function Error() {
	return (
		<StyledError>
			<Title size="large" color="error">
				페이지를 찾을 수 없습니다.
			</Title>
			<Button size="medium" scheme="primary">
				<Link href="/">홈으로 돌아가기</Link>
			</Button>
		</StyledError>
	);
}

const StyledError = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 2rem auto;
	height: 100%;
	gap: 2rem;
`;

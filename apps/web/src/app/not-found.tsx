'use client';

import Link from 'next/link';
import styled from 'styled-components';
import Title from '@/components/common/Title';
import Button from '@/components/common/Button';
import Text from '@/components/common/Text';

const NotFoundPage = () => {
	return (
		<StyledNotFound>
			<Title size="large" weight="bold" color="error">
				404 - 페이지를 찾을 수 없습니다.
			</Title>
			<Text size="large">죄송합니다. 요청하신 페이지를 찾을 수 없습니다.</Text>
			<Link href="/">
				<Button as="a" size="medium" scheme="primary">
					홈으로 돌아가기
				</Button>
			</Link>
		</StyledNotFound>
	);
};

const StyledNotFound = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	margin-top: 2rem;

	a {
		margin-top: 1rem;
	}
`;

export default NotFoundPage;

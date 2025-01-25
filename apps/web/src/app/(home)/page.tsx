'use client';

import { useNewsletter } from '@/hooks/useNewsletter';
import { styled } from 'styled-components';
import Title from '@/components/common/Title';
import FullWidthPanel from '@/components/common/FullWidthPanel';
import HeroSection from '@/app/(home)/_components/HeroSection';
import TrendSection from '@/app/(home)/_components/TrendSection';
import SubscribeSection from '@/app/(home)/_components/SubscribeSection';

const HomePage = () => {
	const { newsletters } = useNewsletter();

	return (
		<StyledHomePage>
			<HeroSection />
			<hr />
			<TrendSection newsletters={newsletters} />

			<FullWidthPanel>
				<Title size="extraLarge" weight="bold" color="background">
					📩 지금 뉴스레터를 시작해보세요
				</Title>
			</FullWidthPanel>

			<SubscribeSection />
		</StyledHomePage>
	);
};

const StyledHomePage = styled.div`
	width: 100%;
	gap: 2rem;

	hr {
		width: 100%;
		border: none;
		border-bottom: 1px solid ${({ theme }) => theme.color.border};
		margin: 0;
		padding: 0;
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		padding: 0 1rem;
	}
`;

export default HomePage;

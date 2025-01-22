import { Suspense, lazy } from 'react';
import { Newsletter as INewsletter } from '@/models/newsletter.model';
import { filterTodayTrends } from '@/utils/queryNewsletters';

import { styled } from 'styled-components';
import { IoIosHeartEmpty } from 'react-icons/io';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import Loader from '@/components/common/Loader';

const LazyCard = lazy(() => import('@/components/common/Card'));

interface Props {
	newsletters: INewsletter[];
}

const TrendSection = ({ newsletters }: Props) => {
	const todayTrends = filterTodayTrends(newsletters);
	const isLoading = newsletters.length === 0;

	return (
		<StyledTrendSection>
			<div className="trend-header">
				<Title size="extraSmall" weight="semiBold">
					오늘의 트렌드
				</Title>
			</div>
			{isLoading ? (
				<div className="placeholder">
					<Loader />
				</div>
			) : (
				<Suspense fallback={<Loader />}>
					<div className="trend-cards">
						{todayTrends.map((trend) => (
							<LazyCard
								key={trend.id}
								data={{
									id: trend.id,
									image: trend.image,
									header: trend.category,
									main: {
										title: trend.title,
										description: trend.summary,
									},
									footer: (
										<>
											<Text color="subText">{trend.date}</Text>
											<div className="right">
												<Button className="rounded-icon-button">
													<IoIosHeartEmpty />
												</Button>
											</div>
										</>
									),
								}}
							/>
						))}
					</div>
				</Suspense>
			)}
		</StyledTrendSection>
	);
};

const StyledTrendSection = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	padding: 2rem 0;
	gap: 2rem;

	.placeholder {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.trend-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;

		button {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
	}

	.trend-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
		width: 100%;
		height: fit-content;
	}

	@media ${({ theme }) => theme.mediaQuery.tablet} {
		flex-wrap: wrap;
	}
`;

export default TrendSection;

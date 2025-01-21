import { useMemo } from 'react';
import { Newsletter as INewsletter } from '@/models/newsletter.model';
import useLoadingStore from '@/stores/loadingStore';
import { filterTodayTrends } from '@/utils/queryNewsletters';

import { styled } from 'styled-components';
import { IoIosHeartEmpty } from 'react-icons/io';
import Title from '@/components/common/Title';
import Text from '@/components/common/Text';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

interface Props {
	newsletters: INewsletter[];
}

const TrendSection = ({ newsletters }: Props) => {
	const { isLoading } = useLoadingStore();
	const todayTrends = useMemo(() => filterTodayTrends(newsletters), [newsletters]);

	if (isLoading) return <div>Loading...</div>;

	return (
		<StyledTrendSection>
			<div className="trend-header">
				<Title size="extraSmall" weight="semiBold">
					오늘의 트렌드
				</Title>
			</div>
			<div className="trend-cards">
				{todayTrends.map((trend, index) => (
					<Card
						key={index}
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
		</StyledTrendSection>
	);
};

export const StyledTrendSection = styled.section`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start;
	padding: 2rem 0;
	gap: 2rem;

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

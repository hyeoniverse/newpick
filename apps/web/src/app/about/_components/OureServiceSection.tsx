'use client';

import { ArticleSummary as IArticleSummary } from '@/models/article.model';
import { styled } from 'styled-components';
import Text from '@/components/common/Text';
import BorderTitle from '@/components/common/BorderTitle';
import TrendSection from '@/app/(home)/_components/TrendSection';

interface Props {
	trends: IArticleSummary[];
}

export default function OurServiceSection({ trends }: Props) {
	return (
		<StyledWhoSection>
			<div className="content">
				<BorderTitle text="OUR SERVICE" />
			</div>
			<Text size="medium">뉴픽이 생성한 다양한 아티클을 이용해보세요. </Text>
			<TrendSection trends={trends} />
		</StyledWhoSection>
	);
}

const StyledWhoSection = styled.div`
	.trend-header {
		display: none;
	}
`;

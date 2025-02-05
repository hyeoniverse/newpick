'use client';

import { styled } from 'styled-components';
import Text from '@/components/common/Text';
import BorderTitle from '@/components/common/BorderTitle';
import FullWidthPanel from '@/components/common/FullWidthPanel';

export default function WhoSection() {
	return (
		<StyledWhoSection>
			<FullWidthPanel background="mono" className="panel">
				<div className="content">
					<BorderTitle text="WHO WE ARE" color="white" className="title" />
				</div>
				<div className="content">
					<Text size="small" color="white">
						함께 뉴픽을 만든 팀원을 소개합니다.
					</Text>
				</div>
			</FullWidthPanel>
		</StyledWhoSection>
	);
}

const StyledWhoSection = styled.div`
	.panel {
		padding: 6rem 0;
		display: flex;
		flex-direction: column;

		.content {
			width: 100%;
			height: 100%;
			max-width: ${({ theme }) => theme.layout.width.large};
			padding: 0 1rem;

			.title {
				margin-bottom: 0.5rem;
			}
		}
	}
`;

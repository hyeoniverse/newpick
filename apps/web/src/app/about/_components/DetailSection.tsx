'use client';

import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/constants/images';
import { GITHUB } from '@/constants/about';

import { styled } from 'styled-components';
import Text from '@/components/common/Text';
import Image from '@/components/common/Image';
import BorderTitle from '@/components/common/BorderTitle';
import FullWidthPanel from '@/components/common/FullWidthPanel';

export default function DetailSection() {
	return (
		<StyledDetailSection>
			<FullWidthPanel background="mono" className="panel">
				<div className="content">
					<BorderTitle text="DETAIL OF NEWPICK" className="header" />
				</div>
				<div className="content">
					<Link href="/mypage" passHref className="image-link">
						<Image src={DEFAULT_IMAGES.SUBSCRIBE} alt="subscribe" />
						<Text size="medium" color="white" className="overlay-text">
							SUBSCRIBE
						</Text>
					</Link>
					<Link href={GITHUB.TEAM} passHref className="image-link">
						<Image src={DEFAULT_IMAGES.GITHUB} alt="github" />
						<Text size="medium" color="white" className="overlay-text">
							GITHUB
						</Text>
					</Link>
				</div>
			</FullWidthPanel>
		</StyledDetailSection>
	);
}

const StyledDetailSection = styled.div`
	width: 100%;
	margin-top: auto;

	.panel {
		width: 100vw;
		display: flex;
		flex-direction: column;
		color: ${({ theme }) => theme.color.text};
		border: 1px solid transparent;
		background: ${({ theme }) => theme.color.surface};
		margin: 0;

		.content {
			width: 100%;
			max-width: ${({ theme }) => theme.layout.width.large};

			display: flex;
			justify-content: center;
			align-items: center;
			gap: 1rem;

			.image-link {
				position: relative;
				display: inline-block;
				cursor: pointer;

				img {
					display: block;
					width: 100%;
					height: auto;
				}

				.overlay-text {
					width: 100%;
					height: 100%;
					position: absolute;

					display: flex;
					justify-content: center;
					align-items: center;

					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					font-size: ${({ theme }) => theme.fontSize.extraLarge};
					font-weight: bold;
					background: rgba(0, 0, 0, 0.5);
					padding: 0.5rem 1rem;
					border-radius: 5px;
				}
			}
		}
	}
`;

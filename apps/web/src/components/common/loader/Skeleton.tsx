import styled, { keyframes } from 'styled-components';

// 로딩 애니메이션 효과
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const LoaderContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: 100%;
`;

const SkeletonCard = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 180px;
	background: ${({ theme }) => theme.color.neutral};
	border-radius: ${({ theme }) => theme.borderRadius.soft};
	overflow: hidden;
`;

const SkeletonImage = styled.div`
	width: 100%;
	height: 120px;
	background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
	background-size: 200% 100%;
	animation: ${shimmer} 1.5s infinite linear;
`;

const SkeletonText = styled.div`
	width: 80%;
	height: 16px;
	background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
	background-size: 200% 100%;
	animation: ${shimmer} 1.5s infinite linear;
	margin: 10px auto;
	border-radius: 4px;
`;

const Loader = () => {
	return (
		<LoaderContainer>
			{Array.from({ length: 4 }).map((_, index) => (
				<SkeletonCard key={index}>
					<SkeletonImage />
					<SkeletonText />
				</SkeletonCard>
			))}
		</LoaderContainer>
	);
};

export default Loader;

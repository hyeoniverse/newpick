import { styled } from 'styled-components';
import { NAVIGATION } from '../../constants/navigation';

const Navigation = () => {
	return (
		<StyledNavigation id="navigation">
			<ul>
				{NAVIGATION.map((item, index) => (
					<li key={index}>{item.title}</li>
				))}
			</ul>
		</StyledNavigation>
	);
};

const StyledNavigation = styled.nav`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: flex-start;
	white-space: nowrap;

	width: 100%;
	height: 100%;

	ul {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		list-style: none;
		padding: 0;
		margin: 0 1rem 0 1rem;
		gap: 1.2rem;
		line-height: 1;

		li {
			padding: 0;
			margin: 0;
			cursor: pointer;

			font-size: ${({ theme }) => theme.fontSize.small};

			&:hover {
				color: ${({ theme }) => theme.color.primary};
				font-weight: ${({ theme }) => theme.fontWeight.semiBold};
			}

			a {
				font-size: ${({ theme }) => theme.fontSize.medium};
				font-weight: ${({ theme }) => theme.fontWeight.medium};
				color: ${({ theme }) => theme.color.text};
				text-decoration: none;
				transition: color 0.3s ease;
			}
		}
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		display: none;
	}
`;

export default Navigation;

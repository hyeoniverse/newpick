'use client';

import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

const logo = '/icons/logo.svg';
const logo_s = '/icons/logo_small.svg';

const Logo = () => {
	return (
		<Link href="/">
			<StyledLogo>
				<Image src={logo} alt="logo" width={100} height={36} className="desktop-logo" priority />
				<Image src={logo_s} alt="logo" width={36} height={36} className="mobile-logo" priority />
			</StyledLogo>
		</Link>
	);
};

const StyledLogo = styled.div`
	color: ${({ theme }) => theme.color.primary};
	font-size: ${({ theme }) => theme.fontSize.large};
	font-weight: ${({ theme }) => theme.fontWeight.bold};
	cursor: pointer;

	img {
		display: none;
	}

	.desktop-logo {
		display: block;
	}

	@media ${({ theme }) => theme.mediaQuery.mobile} {
		.desktop-logo {
			display: none;
		}

		.mobile-logo {
			display: block;
		}
	}
`;

export default Logo;

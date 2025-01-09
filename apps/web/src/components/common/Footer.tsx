'use client';

import Link from 'next/link';
import styled from 'styled-components';
import Logo from '@/components/common/Logo';

const Footer = () => {
	return (
		<StyledFooter>
			<div className="footer">
				<Logo logoType='footer-logo'/>
				<div className="footer-menu">
					<Link className="footer-item" href="#">
						Privacy Policy
					</Link>
					<Link className="footer-item" href="#">
						Terms of Service
					</Link>
					<Link className="footer-item" href="#">
						Contact
					</Link>
				</div>
				<p>© 2025 NewPick. All Rights Reserved.</p>
			</div>
		</StyledFooter>
	);
};

const StyledFooter = styled.footer`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;

	width: 100%;
	margin-top: auto;
	padding: 3rem 0;
	background: ${({ theme }) => theme.color.surface};
	border-top: 1px solid ${({ theme }) => theme.color.border};

	.footer {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;

		width: 100%;
		max-width: ${({ theme }) => theme.layout.width.large};
		padding: 0 1rem;

		p {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.lightGrey};
		}
	}

	.footer-menu {
		display: grid;
		grid-template-columns: repeat(4, max-content);
		gap: 1rem;

		a {
			font-size: ${({ theme }) => theme.fontSize.extraSmall};
			color: ${({ theme }) => theme.color.subtext};
			cursor: pointer;

			&:hover {
				text-decoration: none;
				color: ${({ theme }) => theme.color.primary};
			}
		}

	}
`;

export default Footer;

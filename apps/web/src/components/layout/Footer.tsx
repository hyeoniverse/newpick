'use client';

import Link from 'next/link';
import styled from 'styled-components';
import Logo from '@/components/common/Logo';
import Text from '@/components/common/Text';
import { FaGithub } from 'react-icons/fa';

const Footer = () => {
	return (
		<StyledFooter id="footer-el">
			<div className="footer">
				<Logo logoType="footer-logo" />
				<div className="footer-menu">
					<Text size="extraSmall">서비스 이용 문의</Text>
					<Link className="footer-item email" href="mailto:newpick@gmail.com">
						newpick@gmail.com
					</Link>
					<Link className="footer-item" href="#">
						개인정보처리방침
					</Link>
					<Link className="footer-item" href="#">
						이용약관
					</Link>
					<Link className="footer-item" href="https://github.com/Devcourse-NewPick" target="_blank">
						<FaGithub />
					</Link>
				</div>
				<Text size="extraSmall" color="subText">
					© 2025 NewPick. All Rights Reserved.
				</Text>
			</div>
		</StyledFooter>
	);
};

const StyledFooter = styled.footer`
	height: fit-content;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	align-items: center;

	width: 100%;
	margin-top: auto;
	padding: 3rem 0;
	background: ${({ theme }) => theme.color.surface};
	border-top: 1px solid ${({ theme }) => theme.color.border};

	.footer {
		width: 100%;
		max-width: ${({ theme }) => theme.layout.width.large};

		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-start;
		gap: 1rem;

		color: ${({ theme }) => theme.color.subText};
	}

	.footer-menu {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: ${({ theme }) => theme.fontSize.extraSmall};

		a {
			cursor: pointer;

			&:hover {
				text-decoration: none;
				color: ${({ theme }) => theme.color.primary};
			}
		}
	}
`;

export default Footer;

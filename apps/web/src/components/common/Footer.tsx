"use client";

import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { FaGithub } from "react-icons/fa";

const logo = "/icons/logo.svg";
const logo_s = "/icons/logo_small.svg";

const Footer = () => {
  return (
    <StyledFooter>
      <div className="inner-footer">
        <Link href="/">
          <Logo>
            <Image
              src={logo}
              alt="logo"
              width={100}
              height={36}
              className="desktop-logo"
              priority
            />
            <Image
              src={logo_s}
              alt="logo"
              width={36}
              height={36}
              className="mobile-logo"
              priority
            />
          </Logo>
        </Link>

        <div className="footer-menu">
          <Link href="#">About</Link>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Contact</Link>
          <a
            href="https://github.com/Devcourse-NewPick"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
          </a>
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
  padding: 4rem 0 3rem 0;
  background: ${({ theme }) => theme.color.surface};
  border-top: 1px solid ${({ theme }) => theme.color.border};

  .inner-footer {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;

    width: 100%;
    max-width: ${({ theme }) => theme.layout.width.large};
    padding: 0 1rem;

    a {
      color: ${({ theme }) => theme.color.text};
      font-size: ${({ theme }) => theme.fontSize.small};
      white-space: nowrap;

      &:hover {
        color: ${({ theme }) => theme.color.primary};
      }
    }
  }

  .footer-menu {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    flex-wrap: wrap;
  }
`;

const Logo = styled.div`
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

export default Footer;

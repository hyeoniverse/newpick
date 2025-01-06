"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import styled from "styled-components";
import Button from "@/components/common/Button";
import Navigation from "@/components/header/Navigation";
import Drawer from "@/components/header/Drawer";
import Dropdown from "@/components/common/Dropdown";
import ThemeSwitcher from "@/components/header/ThemeSwitcher";
import { FaUserCircle } from "react-icons/fa";

const logo = "/icons/logo.svg";
const logo_s = "/icons/logo_small.svg";

const Header = () => {
  const [isLogin, setIsLogin] = useState(false);
  const user = null;

  const toggleLogin = () => {
    setIsLogin(!isLogin);
  };

  return (
    <StyledHeader id="header">
      <div className="inner-header">
        <div className="left-section">
          <Drawer />
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
        </div>
        <Navigation />
        <div className="right-section">
          <ThemeSwitcher className="mobile-hidden" />
          {isLogin ? (
            <Dropdown
              className="auth"
              toggleButton={
                <>
                  {user ? (
                    <Image
                      className="userCircle"
                      src={logo}
                      alt="user"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <FaUserCircle className="userCircle" />
                  )}
                </>
              }
            >
              <>
                <ThemeSwitcher className="desktop-hidden" />
                <Link href="/myPage" className="item">
                  마이 페이지
                </Link>
                <Button onClick={toggleLogin}>로그아웃</Button>
              </>
            </Dropdown>
          ) : (
            <>
              <Button onClick={toggleLogin} style={{ width: "5rem" }}>
                로그인
              </Button>
            </>
          )}
          <Button scheme="primary" style={{ width: "5rem" }}>
            구독하기
          </Button>
        </div>
      </div>
    </StyledHeader>
  );
};

const StyledHeader = styled.div`
  width: 100%;
  padding: 0;
  margin: 0;

  -ms-overflow-style: none;
  ::-webkit-scrollbar {
    display: none;
  }

  background: ${({ theme }) => theme.color.background};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  .inner-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    margin: 0 auto;
    padding: 0.5rem 1rem;
    gap: 1rem;

    width: 100%;
    max-width: ${({ theme }) => theme.layout.width.large};
  }

  .left-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }

  .right-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;

    .userCircle {
      width: ${({ theme }) => theme.fontSize.large};
      height: ${({ theme }) => theme.fontSize.large};
      border-radius: ${({ theme }) => theme.borderRadius.circle};
      object-fit: cover;
    }
  }

  .mobile-hidden {
    @media ${({ theme }) => theme.mediaQuery.mobile} {
      display: none;
    }
  }

  .desktop-hidden {
    display: none;

    @media ${({ theme }) => theme.mediaQuery.mobile} {
      display: block;
    }
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

export default Header;

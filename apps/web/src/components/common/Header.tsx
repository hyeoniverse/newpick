import { useState } from "react";
import { Link } from "react-router-dom";
import { styled } from "styled-components";
import logo from "../../assets/logo.svg";
import logo_s from "../../assets/logo_small.svg";
import Button from "./Button";
import Navigation from "../header/Navigation";
import Drawer from "../header/Drawer";
import Dropdown from "./Dropdown";
import ThemeSwitcher from "../header/ThemeSwitcher";
import { FaUserCircle } from "react-icons/fa";

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
          <Link to="/">
            <Logo>
              <img src={logo} alt="logo" className="desktop-logo" />
              <img src={logo_s} alt="logo" className="mobile-logo" />
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
                    <img className="userCircle" src={user} alt="user" />
                  ) : (
                    <FaUserCircle className="userCircle" />
                  )}
                </>
              }
            >
              <>
                <ThemeSwitcher className="desktop-hidden" />
                <Link to="/mypage" className="item">
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

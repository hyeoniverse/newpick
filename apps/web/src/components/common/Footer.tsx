import styled from "styled-components";
import { FaGithub } from "react-icons/fa";
import logo from "../../assets/logo.svg";

const Footer = () => {
  return (
    <StyledFooter>
      <div className="inner-footer">
        <Logo>
          <img src={logo} alt="logo" />
        </Logo>
        <div className="footer-menu">
          <a href="#">About</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
          <a href="https://github.com/Devcourse-NewPick" target="_blank">
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

const Logo = styled.div``;

export default Footer;

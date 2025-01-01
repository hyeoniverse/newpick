import React from "react";
import styled from "styled-components";
import Header from "../common/Header";
import Footer from "../common/Footer";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <StyledLayout>
      <Header />
      <Content>{children}</Content>
      <Footer />
    </StyledLayout>
  );
};

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Content = styled.main`
  width: 100%;
  margin: 0 auto;
  max-width: ${({ theme }) => theme.layout.width.large};
  padding: 6rem 2rem;
  @media screen AND ${({ theme }) => theme.mediaQuery.mobile} {
    padding: 6rem 1rem;
  }
`;

export default Layout;

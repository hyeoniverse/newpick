"use client";

import styled from "styled-components";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TopButton from "@/components/common/TopButton";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <StyledLayout>
      <Header />
      <Content>{children}</Content>
      <TopButton />
      <Footer />
    </StyledLayout>
  );
};

const StyledLayout = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100vw;
  height: 100vh;
`;

const Content = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.width.large};
  margin: 0 auto;
  padding: 0.5rem 1rem;

  @media ${({ theme }) => theme.mediaQuery.mobile} {
    padding: 20px 12px;
  }
`;

export default Layout;

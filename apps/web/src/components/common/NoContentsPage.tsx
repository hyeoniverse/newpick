'use client'

import styled from "styled-components";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import Link from "next/link";

interface NoContentsPageProps {
  text: string;
  btnText?: string;
  onClick?: () => void;
  moveTo?: string;
}

function NoContentsPage({text, btnText, onClick, moveTo}: NoContentsPageProps) {
  return (
    <NoContentsPageStyled>
      <Title size="medium">{text}</Title>
      {moveTo ?
        <Link href={moveTo}>
          <Button scheme="primary" size="medium" onClick={onClick}>
            {btnText}
          </Button>
        </Link>
        :
        <Button scheme="primary" size="medium" onClick={onClick}>
          {btnText}
        </Button>
      }
    </NoContentsPageStyled>
  );
}

const NoContentsPageStyled = styled.div`
    text-align: center;
    margin: 6rem;
    display: flex;
    flex-direction: column;
    gap: 1.875rem;
    align-items: center;

    p {
        white-space: pre-line;
    }

    button {
        width: 12rem;
        font-weight: ${({theme}) => theme.fontWeight.medium};
    }

`;

export default NoContentsPage;
'use client'

import styled from "styled-components";
import Button from "@/components/common/Button";

interface Props {
  className?: string;
}

function SubscribeInduce({ className }: Props) {
  return (
    <SubscribeInduceStyled className={className}>
      <p>뉴픽이 보내드리는 뉴스레터를 구독해보세요!</p>
      <Button scheme="primary" size="medium">구독하기</Button>
    </SubscribeInduceStyled>
  );
}

const SubscribeInduceStyled = styled.div`
    background-color: ${({theme}) => theme.color.tertiary};
    border-radius: ${({theme}) => theme.borderRadius.soft};
    padding: 2rem 4rem;
    gap: 2rem;
    
    display: flex;
    flex-direction: row;
    align-items: center;
    
    p {
        width: 100%;
        font-size: ${({theme}) => theme.fontSize.extraLarge};
        font-weight: ${({theme}) => theme.fontWeight.semiBold};
        background: linear-gradient(to right top, #0C0042, #2d11b1, #5537dd, #0E004D);
        color: transparent;
        -webkit-background-clip: text;
        
        word-break: keep-all;
    }
    
    button {
        width: 10rem;
        height: 2.875rem;
        border-radius: ${({theme}) => theme.borderRadius.soft};
        font-size: ${({theme}) => theme.fontSize.medium};
    }

    @media screen and ${({ theme }) => theme.mediaQuery.tablet} {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
        padding: 2rem;
    }
    
    @media screen and ${({ theme }) => theme.mediaQuery.mobile} {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
        padding: 2rem;
    }
`;

export default SubscribeInduce;
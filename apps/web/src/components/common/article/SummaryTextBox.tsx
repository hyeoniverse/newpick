'use client'

import styled from "styled-components";

interface Props {
  flex?: number;
  children?: React.ReactNode;
  className?: string;
}

function SummaryTextBox({children, className, flex}: Props) {
  return (
    <SummaryContainerStyled flex={flex} className={className}>
      <SummaryTitleStyled>AI 요약</SummaryTitleStyled>
      <SummaryTextBoxStyled>{children}</SummaryTextBoxStyled>
    </SummaryContainerStyled>
  );
}

const SummaryContainerStyled = styled.div<Props>`
    flex: ${({flex}) => flex || 1};
    background-color: ${({theme}) => theme.color.surface};
    border: 1px solid ${({theme}) => theme.color.border};
    border-radius: ${({theme}) => theme.borderRadius.soft};
    padding: 1.25rem;
    height: 100%;
`

const SummaryTextBoxStyled = styled.p`
    color: ${({theme}) => theme.color.mediumGrey};
`;

const SummaryTitleStyled = styled.h5`
    font-size: ${({ theme }) => theme.fontSize.small};
    margin-bottom: 0.5rem;
`

export default SummaryTextBox;
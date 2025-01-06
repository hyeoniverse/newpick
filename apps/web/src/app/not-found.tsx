"use client";

import styled from "styled-components";
import Title from "@/components/common/Title";

export default function Error() {
  return (
    <StyledError>
      <Title size="extraLarge" color="error">
        오류가 발생했습니다.
      </Title>
      <Title size="small">페이지를 찾을 수 없습니다.</Title>
    </StyledError>
  );
}

const StyledError = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem auto;
  height: 100%;
`;

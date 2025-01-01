import { useRouteError } from "react-router-dom";
import { styled } from "styled-components";
import Title from "./Title";

interface RouteError {
  statusText?: string;
  message?: string;
}

const Error = () => {
  const error = useRouteError() as RouteError;

  return (
    <StyledError>
      <Title size="extraLarge" color="error">
        오류가 발생했습니다.
      </Title>
      <Title size="small">다음과 같은 오류가 발생했습니다.</Title>
      <Title size="small">{error.statusText || error.message}</Title>
    </StyledError>
  );
};

const StyledError = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

export default Error;

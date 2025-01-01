import { createGlobalStyle } from "styled-components";
import "sanitize.css";
import { ThemeName } from "./theme";
import Pretendard from "../assets/fonts/Pretendard.woff2";

interface Props {
  themeName: ThemeName;
}

export const GlobalStyle = createGlobalStyle<Props>`
  @font-face {
    font-family: 'Pretendard';
    src: local('Pretendard'), url(${Pretendard}) format('woff2');
  }

  * {
    font-family: 'Pretendard', sans-serif;
  }

  html,body {
    margin: 0;
    padding: 0;
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.background};
  }

  a {
    text-decoration: none;
  }
`;

'use client';

import 'sanitize.css';
import { createGlobalStyle } from 'styled-components';
import { ThemeName } from './theme';

interface Props {
	themeName: ThemeName;
}

const Pretendard = '/fonts/Pretendard.woff2';

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
	  overflow-x: hidden;
	  overflow-y: hidden;

  }

  a {
    text-decoration: none;
  }

  input {
	  outline: none;
  }
  
  ul, li {
	  list-style: none;
	  margin: 0;
	  padding: 0;
  }
  
  h1, h2, h3, h4, h5, h6, p {
	  margin: 0;
  }
`;

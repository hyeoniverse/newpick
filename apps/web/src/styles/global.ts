'use client';

import 'sanitize.css';
import { createGlobalStyle } from 'styled-components';
import { STYLE } from '@/constants/numbers';
import { darkTheme, lightTheme, themeVars } from '@/styles/theme';

export const GlobalStyle = createGlobalStyle`
    /* 테마 색: <html data-theme>(머리의 스크립트가 그리기 전에 정한다)에 따라 바뀐다 */
    :root {
        ${themeVars(lightTheme)}
    }

    :root[data-theme='dark'] {
        ${themeVars(darkTheme)}
        color-scheme: dark;
    }

    /* 글꼴: Pretendard 다이나믹 서브셋 (styles/pretendard.css, #14). 받는 동안은 시스템 글꼴 */
    * {
        font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    }

    html, body {
      margin: 0;
      padding: 0;
      color: ${({ theme }) => theme.color.text};
      background: ${({ theme }) => theme.color.background};
      scroll-behavior: smooth;
      font-size: ${STYLE.ROOT_FONT_SIZE};
      
      @media ${({ theme }) => theme.mediaQuery.mobile} {
        /* 스크롤바 숨김 처리 (브라우저별 설정) */
        scrollbar-width: none; /* Firefox */
        &::-webkit-scrollbar {
            display: none; /* Webkit 기반 브라우저 (Chrome, Safari, Edge) */
        }

        -ms-overflow-style: none; /* IE, Edge */
      }

      a {
          text-decoration: none;
          color: ${({ theme }) => theme.color.text};
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
	      	white-space: pre-line;
      }

      button {
          border: none;
          background-color: transparent;

          &:focus {
              outline: none;
          }
      }
    }
`;

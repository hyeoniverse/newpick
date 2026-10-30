'use client';

import 'sanitize.css';
import { createGlobalStyle } from 'styled-components';
import { STYLE } from '@/constants/numbers';
import { darkTheme, fontVars, lightTheme, themeVars } from '@/styles/theme';

export const GlobalStyle = createGlobalStyle`
    /* 테마 색: <html data-theme>(머리의 스크립트가 그리기 전에 정한다)에 따라 바뀐다 */
    :root {
        ${themeVars(lightTheme)}
    }

    :root[data-theme='dark'] {
        ${themeVars(darkTheme)}
        color-scheme: dark;
    }

    /* 글자 크기: 화면이 좁아지면 한 단계씩 줄어든다 (theme.fontSize · theme.heading) */
    :root {
        ${fontVars()}
        /* 화면 오른쪽 아래에 떠 있는 위·아래 스크롤 버튼(ScrollButtons)이 차지하는 폭: 오른쪽 1.5rem + 버튼 2.5rem + 틈 0.5rem.
           바닥에 붙는 막대는 이만큼 비켜 간다 */
        --np-float-space: 4.5rem;
    }

    @media ${lightTheme.mediaQuery.tablet} {
        :root {
            ${fontVars('tablet')}
        }
    }

    @media ${lightTheme.mediaQuery.mobile} {
        :root {
            ${fontVars('mobile')}
        }
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
      }
    }

    /* 키보드로 옮겨 다닐 때만 보이는 포커스 테두리 (#16). 마우스로 누를 때는 보이지 않는다 */
    :focus-visible {
        outline: 2px solid ${({ theme }) => theme.color.primary};
        outline-offset: 2px;
    }

    :focus:not(:focus-visible) {
        outline: none;
    }

    /* 본문 바로가기: 평소엔 숨기고 Tab을 처음 누르면 왼쪽 위에 보인다.
       위로 밀어 두기만 하면 맥에서 맨 위를 더 끌어올릴 때(튕김) 드러나서, 투명하게 · 누를 수 없게도 둔다 */
    .skip-link {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 10000;
        padding: 0.625rem 1rem;
        border-radius: ${({ theme }) => theme.radius.surface};
        background: ${({ theme }) => theme.color.primary};
        color: #ffffff;
        font-weight: 600;
        transform: translateY(-200%);
        opacity: 0;
        pointer-events: none;

        &:focus-visible {
            transform: none;
            opacity: 1;
            pointer-events: auto;
        }
    }
`;

"use client";

import "sanitize.css";
import { createGlobalStyle } from "styled-components";
import { ThemeName } from "./theme";

interface Props {
  themeName: ThemeName;
}

const Pretendard = "/fonts/Pretendard.woff2";

export const GlobalStyle = createGlobalStyle<Props>`
    @font-face {
        font-family: 'Pretendard';
        src: local('Pretendard'), url(${Pretendard}) format('woff2');
    }

    * {
        font-family: 'Pretendard', sans-serif;
    }

    html, body {
        margin: 0;
        padding: 0;
        color: ${({theme}) => theme.color.text};
        background: ${({theme}) => theme.color.background};
        scroll-behavior: smooth;

        /* 스크롤바 숨김 처리 (브라우저별 설정) */
        scrollbar-width: none; /* Firefox */

        &::-webkit-scrollbar {
            display: none; /* Webkit 기반 브라우저 (Chrome, Safari, Edge) */
        }
        -ms-overflow-style: none; /* IE, Edge */
    }

    a {
        text-decoration: none;
        color: ${({theme}) => theme.color.text};
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

    button {
        border: none;
        background-color: transparent;

        &:focus {
            border: none;
            outline: none;
        }
    }
`;

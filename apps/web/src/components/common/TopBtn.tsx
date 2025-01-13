"use client"

import styled from "styled-components";
import { FaChevronUp } from "react-icons/fa6";
import { useEffect, useState } from "react";

function TopBtn() {
  const [ showButton, setShowButton ] = useState(false)

  const handleTopBtn = () => {
    window.scroll({
      top: 0,
      behavior: "smooth",
    })
  }

  useEffect(() => {

    const handleScroll = () => {
      const footer = document.getElementById("footer-el");
      if (!footer) return;

      const footerTop = footer.offsetTop;
      const scrollBottom = window.scrollY + window.innerHeight;

      if (scrollBottom > footerTop) {
        setShowButton(false);
      } else {
        setShowButton(window.scrollY > 100);
      }
    };

    // 컴포넌트 마운트 시 스크롤 이벤트 등록
    window.addEventListener("scroll", handleScroll);
    // 언마운트 = 해제
    return () => {
      window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <>
        <TopBtnStyled
          onClick={handleTopBtn}
          className={showButton ? 'fade-in' : 'fade-out'}
        >
          <FaChevronUp />
        </TopBtnStyled>
    </>
  );
}

const TopBtnStyled = styled.button`
    position: fixed;
    height: 4rem;
    width: 4rem;
    cursor: pointer;

    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 999;

    background-color: ${({theme}) => theme.color.text};
    color: ${({theme}) => theme.color.background};
    border-radius: ${({theme}) => theme.borderRadius.circle};

    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;

    &.fade-in {
        opacity: 80%;
        transform: translateY(0);
    }
    &.fade-out {
        opacity: 0;
        transform: translateY(60px);
    }
    svg {
        position: absolute;
        width: 1.25rem;
        height: 1.25rem;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
`;

export default TopBtn;
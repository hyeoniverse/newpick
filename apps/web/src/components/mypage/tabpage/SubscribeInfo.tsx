"use client";

import styled from "styled-components";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MYSUMMARYNEWS } from "@/constants/mypageData";
import { useEffect, useRef, useState } from "react";
import useMypage from "@/hooks/useMypage";

interface SubscribeInfoProps {
  activeCategory: string;
}

function SubscribeInfo({ activeCategory }: SubscribeInfoProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [ isSticky, setIsSticky ] = useState(false);
  const { handleAnchorNavigation } = useMypage();

  // 스크롤 좌우 넓어지는 효과
  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;

      if (window.scrollY > 365) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    // 초기 스크롤 상태 확인
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <SubscribeInfoStyled ref={navRef} className={isSticky ? "full-width" : ""}>
      <ContentsStyled>
        <div className="date">
          <IoIosArrowBack />
          <p>2025.01.01</p>
          <IoIosArrowForward />
        </div>
        <ul className="categories">
          {MYSUMMARYNEWS.map((news, index) => (
            <li key={index} className={`category ${activeCategory === news.categoryName ? "active" : ""}`}>
              <button
                onClick={(e) => handleAnchorNavigation(e, news.categoryName)}
              >
                {news.categoryName}
              </button>
            </li>
          ))}
        </ul>
      </ContentsStyled>
    </SubscribeInfoStyled>
  );
}

const SubscribeInfoStyled = styled.div`
    position: sticky;
    width: 100%;
    margin-top: -40px;
    top: 0;
    z-index: 999;
    background-color: transparent;
    border-bottom: none;
    transition: all 0.3s ease;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: ${({theme}) => theme.color.surface};
        border-bottom: 1px solid ${({theme}) => theme.color.border};
        transform: translateX(-50%);
        left: 50%;
        transition: all 0.3s ease;
        z-index: -1;
    }
    
    &.full-width::before {
        width: 100vw;
    }
`;

const ContentsStyled = styled.div`
    padding: 1rem;
    max-width: 1024px;
    margin: 0 auto;

    .date {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: ${({theme}) => theme.fontWeight.bold};
        font-size: ${({theme}) => theme.fontSize.large};
        padding-bottom: 1rem;
    }

    .categories {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.2rem 1.25rem;
        color: ${({theme}) => theme.color.subtext};
        
        .category {
            &.active button{
                color: ${({ theme }) => theme.color.primary};
                font-weight: ${({ theme }) => theme.fontWeight.medium};
            }
            
            button {
                color: ${({ theme }) => theme.color.subtext};
                cursor: pointer;
                font-size: ${({ theme }) => theme.fontSize.small};
                transition: all 0.3s ease;

                &:hover {
                    color: ${({ theme }) => theme.color.primary};
                    font-weight: ${({ theme }) => theme.fontWeight.medium};
                }
            }
        }
    }


`;

export default SubscribeInfo;
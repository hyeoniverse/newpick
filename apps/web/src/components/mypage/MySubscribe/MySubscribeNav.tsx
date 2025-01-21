"use client";

import styled from "styled-components";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useEffect, useRef, useState } from "react";
import useMypage from "@/hooks/useMypage";
import { currentUserData } from "@/mocks";
import { useHeader } from '@/hooks/useHeader';

interface SubscribeInfoProps {
  activeCategory: string;
}

function MySubscribeNav({ activeCategory }: SubscribeInfoProps) {
  const navRef = useRef<HTMLDivElement>(null);
  const [ isSticky, setIsSticky ] = useState(false);
  const { handleAnchorNavigation } = useMypage();

  const { headerHeight } = useHeader();
  const lastScrollY = useRef(0);
  const { summaries } = currentUserData;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });


  // 스크롤 좌우 넓어지는 효과
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 특정 위치 이상 스크롤되면 Sticky 활성화
      setIsSticky(currentScrollY > 365);

      // 현재 스크롤 위치 저장
      lastScrollY.current = currentScrollY;
    };
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <SubscribeInfoStyled
      ref={navRef}
      className={isSticky ? "full-width" : ""}
      $isSticky={isSticky}
      $paddingTop={headerHeight}
    >
      <ContentsStyled>
        <div className="date">
          <IoIosArrowBack />
          <p>{today}</p>
          <IoIosArrowForward />
        </div>
        <ul className="categories">
          {summaries.map((info, index) => (
            <li key={index} className={`category ${activeCategory === info.categoryName ? "active" : ""}`}>
              <button
                onClick={(e) => handleAnchorNavigation(e, info.categoryName)}
              >
                {info.categoryName}
              </button>
            </li>
          ))}
        </ul>
      </ContentsStyled>
    </SubscribeInfoStyled>
  );
}

interface StyledProps {
  $isSticky: boolean;
  $paddingTop: string;
}

const SubscribeInfoStyled = styled.div<StyledProps>`
    position: sticky;
    width: 100%;
    margin-top: -40px;
    top: 0;
    padding-top: ${({ $isSticky, $paddingTop }) => ($isSticky ? $paddingTop : '0')};
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
    max-width: ${({ theme }) => theme.layout.width.large};
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
        color: ${({theme}) => theme.color.mediumGrey};
        
        .category {
            &.active button{
                color: ${({ theme }) => theme.color.primary};
                font-weight: ${({ theme }) => theme.fontWeight.medium};
            }
            
            button {
                color: ${({ theme }) => theme.color.mediumGrey};
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

export default MySubscribeNav;
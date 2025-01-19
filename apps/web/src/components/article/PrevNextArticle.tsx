import { useState } from "react";
import styled from "styled-components";
import MoveButton from "@/components/common/MoveButton";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import ThumbImgRemove from "@/components/common/ThumbImg(remove)";
import Link from "next/link";

interface Props {
  className?: string;
}

function PrevNextArticle({ className }: Props) {
  const [ activeArticle, setActiveArticle ] = useState<string | null>(null);
  
  const handleMouseEnter = (articleType: "prev" | "next") => () => {
    setActiveArticle(articleType);
  }
  
  const handleMouseLeave = () => {
    setActiveArticle(null);
  }
  
  return (
    <PrevNextArticleStyled className={className}>
      <ul>
        <li className={`prev-next prev ${activeArticle === "prev" ? "active" : ""}`}>
          <MoveButton onClick={() => {}} text="이전글" frontIcon={<IoArrowBack />} className="btn"/>
          <Link
            href={"#"}
            className="img"
            onMouseEnter={handleMouseEnter("prev")}
            onMouseLeave={handleMouseLeave}
          >
            <ThumbImgRemove src="/img/newpick_default_img.jpg" aspectratio={1} />
          </Link>
          <Link
            href={"#"}
            className="text-section"
            onMouseEnter={() => setActiveArticle("prev")}
            onMouseLeave={() => setActiveArticle(null)}
          >
            <p className="title">틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트
              타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트
              타이틀 임리스트 타이틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 임 </p>
            <p className="date">2025-01-02</p>
          </Link>
        </li>
        
        <li className={`prev-next next ${activeArticle === "next" ? "active" : ""}`}>
          <MoveButton onClick={() => {}} text="다음글" backIcon={<IoArrowForward />} className="btn" />
          <Link
            href={"#"}
            className="img"
            onMouseEnter={() => setActiveArticle("next")}
            onMouseLeave={() => setActiveArticle(null)}
          >
            <ThumbImgRemove src="/img/newpick_default_img.jpg" aspectratio={1} />
          </Link>
          <Link
            href={"#"}
            className="text-section"
            onMouseEnter={() => setActiveArticle("next")}
            onMouseLeave={() => setActiveArticle(null)}
          >
            <p className="title">틀 임 리스트 타이틀 임 리스트 타이틀 임리스트 타이틀 </p>
            <p className="date">2025-01-02</p>
          </Link>
        </li>
      </ul>
    </PrevNextArticleStyled>
  );
}

const PrevNextArticleStyled = styled.div`
    border-top: 1px solid ${({theme}) => theme.color.border};

    .prev-next {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
        align-items: center;
        height: fit-content;
        border-bottom: 1px solid ${({theme}) => theme.color.border};
        padding: 2.5rem 1rem;

        .btn {
            flex: 0.8;
        }

        .img {
            flex: 1.2;
            margin: 0
        }

        .text-section {
            flex: 8;

            .title {
                color: ${({theme}) => theme.color.mediumGrey};
                font-size: ${({theme}) => theme.fontSize.medium};
                font-weight: ${({theme}) => theme.fontWeight.medium};
                margin-bottom: 0.5rem;

                overflow: hidden;
                text-overflow: ellipsis;

                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
            }

            .date {
                color: ${({theme}) => theme.color.lightGrey};
                font-size: ${({theme}) => theme.fontSize.extraSmall};
            }
        }
    }

    .active {
        background-color: ${({theme}) => theme.color.surface};
    }

    @media screen and ${({ theme }) => theme.mediaQuery.tablet} {
        .prev-next {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.5rem 1rem;
            gap: 1rem;

        }
        
        .img {
            display: none;
        }
    }
    
`;

export default PrevNextArticle;
import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import ThumbImg from "@/components/mypage/common(temporary)/ThumbImg";
import LikeIcon from "@/components/mypage/common(temporary)/LikeIcon";
import Link from "next/link";

function MyBookmark() {
  return (
    <>
      <MyBookmarkStyled>
        {SUMMARYNEWS.map((news, index) => (
          <div key={index} className="card">
            <Link href={`#`}>
            <ThumbImg src={news.img} />
            </Link>
            <div className="content">
              <Link href={`#`} className="category">{news.categoryName}</Link>
              <Link href={`#`} className="title">{news.title}</Link>
              <p className="subtext">{news.summary}</p>
              <div className="etc">
                <div className="date">{news.createdAt}</div>
                {/*<div className="bar"/>*/}
                <LikeIcon />
              </div>
            </div>
          </div>
        ))}
      </MyBookmarkStyled>
    </>
  );
}

const MyBookmarkStyled = styled.div`
    display: grid;
    justify-items: start;
    justify-content: start;
    gap: 2rem;
    grid-template-columns: repeat(3, 1fr);

    .card {
        width: auto;

        .content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .category {
                color: ${({theme}) => theme.color.primary};
                font-size: ${({theme}) => theme.fontSize.extraSmall};
                font-weight: ${({theme}) => theme.fontWeight.medium};
                width: max-content;
            }

            .title, .subtext {
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                word-break: keep-all;
            }

            .title {
                font-size: ${({theme}) => theme.fontSize.large};
                margin: 0;
            }

            .subtext {
                font-size: ${({theme}) => theme.fontSize.extraSmall};
                color: ${({theme}) => theme.color.subtext}
            }


            .etc {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;

                .bar {
                    border-left: 1px solid ${({theme}) => theme.color.border};
                    margin: 0 1.25rem;
                    height: 1.5rem;
                }
                
                .date {
                    font-size: ${({ theme }) => theme.fontSize.extraSmall};
                    color: ${({ theme }) => theme.color.lightGrey};
                }
            }
        }
    }
    
    @media (${({ theme }) => theme.mediaQuery.tablet}) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (${({ theme }) => theme.mediaQuery.mobile}) {
        grid-template-columns: repeat(1, 1fr);
    }

`;


export default MyBookmark;
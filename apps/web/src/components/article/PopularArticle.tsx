"use client"

import styled from "styled-components";
import Link from "next/link";
import ThumbImgRemove from "@/components/mypage/inner-page/MySubscribe/HeightAutoImg";
import { MYSUMMARYNEWS } from "@/lib/mypageData";

interface Props {
  flex?: number;
  className?: string;
}

function PopularArticle({flex, className}: Props) {
  
  const mappedNewsletter = MYSUMMARYNEWS.map((news, i) => ({index: i, value: news}))
  const sortNewsletter = mappedNewsletter.sort((a, b) => b.value.viewcount - a.value.viewcount);
  const sliceNewsletter = sortNewsletter.slice(0, 5);
  
  return (
    <PopularNewsletterStyled flex={flex} className={className}>
      <h3 className="section-title">지금 인기 아티클 TOP 5</h3>
      <ul className="popular-list">
        {sliceNewsletter.map((news, index) => (
          <li key={index}>
            <p className="index">{index + 1}</p>
            <Link href={"#"} className="text-section">
              <div>
                <p className="title">{news.value.title}</p>
                <p className="date">{news.value.createdAt}</p>
              </div>
            </Link>
            {news.value.img ?
              <Link href={"#"} className="thum-link">
                <ThumbImgRemove src={news.value.img} aspectratio={1} />
              </Link>
              :
              <div className="thum-empty"/>
            }
          </li>
        ))}
      </ul>
    </PopularNewsletterStyled>
  );
}

export default PopularArticle;

const PopularNewsletterStyled = styled.div<Props>`
    position: sticky;
    overflow: auto;
    height: 100%;
    top: 1rem;

    .index {
        color: ${({theme}) => theme.color.mediumGrey};
    }

    .section-title {
        font-size: ${({theme}) => theme.fontSize.medium};
        font-weight: ${({theme}) => theme.fontWeight.semiBold};
        padding: 0 0 1rem 0;
        border-bottom: 1px solid ${({theme}) => theme.color.border};
        // border-top: 1px solid ${({theme}) => theme.color.border};
    }

    .popular-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0 1rem 0;
        border-bottom: 1px solid ${({theme}) => theme.color.border};

        li {
            overflow: hidden;
            display: flex;
            flex-direction: row;
            gap: 1rem;

            .thum-link {
                flex: 1;
                height: fit-content;
                margin: 0;
            }

            .text-section {
                flex: 3;
                word-break: break-word;
                height: 4.25rem;

                .category {
                    font-size: ${({theme}) => theme.fontSize.extraSmall};
                    color: ${({theme}) => theme.color.primary};
                    font-weight: ${({theme}) => theme.fontWeight.medium};
                }

                .title {
                    font-size: ${({theme}) => theme.fontSize.small};
                    font-weight: ${({theme}) => theme.fontWeight.medium};

                    overflow: hidden;
                    text-overflow: ellipsis;

                    display: -webkit-box;
                    -webkit-line-clamp: 2; // 원하는 라인수
                    -webkit-box-orient: vertical;
                }

                .date {
                    font-size: ${({theme}) => theme.fontSize.extraSmall};
                    color: ${({theme}) => theme.color.lightGrey};
                }
            }
        }

        li:hover .title {
            color: ${({theme}) => theme.color.primary};
        }

    @media screen and ${({theme}) => theme.mediaQuery.tablet} {
        display: flex;
        flex-direction: column;
        
        .section-title {
            border-top: none;
        }
        
        .popular-list {
            display: flex;
            flex-direction: column; 
            align-items: stretch; 
            gap: 1.5rem;
            margin-bottom: 0;

            li {
                display: flex;
                flex-direction: row;
                align-items: stretch;
                flex: fit-content;
                
                .thum-link {
                    flex: 1;
                }
                
                .thum-empty {
                    flex: 1;
                    aspect-ratio: 1;
                }

                .text-section {
                    flex: 5;
                    justify-content: space-between;
                    
                    .title {
                        height: 3rem;
                    }
                }
            }
        }
    }

    @media screen and ${({theme}) => theme.mediaQuery.mobile} {
        .thum-empty {
            display: none;
        }
    }
`;

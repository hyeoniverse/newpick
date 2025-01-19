import styled from "styled-components";
import { BOOKMARK, MYSUMMARYNEWS } from "@/lib/mypageData";
import ThumbImgRemove from "@/components/common/ThumbImg(remove)";
import LikeIcon from "@/components/common/icon/LikeIcon";
import Link from "next/link";
import NoContentsPage from "@/components/common/NoContentsPage";
import { useEffect, useState } from "react";
import { IMySummary } from "@/models/newsDetail";

function MyBookmark() {
  const [ bookmarkInfo, setBookmarkInfo ] = useState<IMySummary[] | null>(null)

  useEffect(() => {
    async function fetchImgThumb() {

      console.log("Params:", bookmarkInfo); // 값 확인
      try {
        const res = await fetch(`http://localhost:3001/mysummary`);
        if (!res.ok) {
          throw new Error("No such article found");
        }
        const data = await res.json();
        setBookmarkInfo(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchImgThumb();
  }, []);

  return (
    <>
      {BOOKMARK.length > 0 ?
        (
          <>
            <MyBookmarkStyled>
              {bookmarkInfo && bookmarkInfo.map((info, index) => (
                <div key={index} className="card">
                  <Link href={`#`}>
                    <ThumbImgRemove src={info.img} aspectratio={4/3}/>
                  </Link>
                  <div className="content">
                    <Link href={`#`} className="category">{info.categoryName}</Link>
                    <Link href={`#`} className="title">{info.title}</Link>
                    <p className="subtext">{info.summary}</p>
                    <div className="etc">
                      <div className="date">{info.createdAt}</div>
                      {/*<div className="bar"/>*/}
                      <LikeIcon />
                    </div>
                  </div>
                </div>
              ))}
            </MyBookmarkStyled>
          </>
        )
        :
        (
          <NoContentsPage
            text={`북마크한 뉴스레터가 없습니다. \n 다른 뉴스레터를 찾아보세요.`}
            btnText={"오늘의 뉴스레터"}
            moveTo={"/"}
          />)
      }
    </>
  );
}

const MyBookmarkStyled = styled.div`
    display: grid;
    justify-items: start;
    justify-content: start;
    gap: 3rem 2rem;
    grid-template-columns: repeat(3, 1fr);

    .card {
        width: auto;
        height: 100%;

        .content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-top: 1rem;

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
                line-height: 1.2;
                margin: 0;
            }

            .subtext {
                font-size: ${({theme}) => theme.fontSize.extraSmall};
                color: ${({theme}) => theme.color.mediumGrey}
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
                    font-size: ${({theme}) => theme.fontSize.extraSmall};
                    color: ${({theme}) => theme.color.lightGrey};
                }
            }
        }
    }

    @media (${({theme}) => theme.mediaQuery.tablet}) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (${({theme}) => theme.mediaQuery.mobile}) {
        grid-template-columns: repeat(1, 1fr);
    }
`;


export default MyBookmark;
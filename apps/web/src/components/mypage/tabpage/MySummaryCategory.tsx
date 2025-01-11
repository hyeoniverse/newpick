import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import { IoIosArrowForward, IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { useState } from "react";
import { LuExternalLink } from "react-icons/lu";
import { LuLink2 } from "react-icons/lu";
import Link from "next/link";

function MySummaryCategory() {
  const [ like, setLike ] = useState(false)

  const handleLike = () => {
    setLike(!like);
  }

  return (
    <>
      <MySummaryCategoryStyled>
        {SUMMARYNEWS.map((news, index) => (
          <div key={index} className="content" id={news.categoryName}>

            <div className="top">
              <Link href="/mypage" className="category-name">
                {news.categoryName}
                <IoIosArrowForward />
              </Link>
              <div className="title-section">
                <h3 className="title-text">{news.title}</h3>
              </div>
            </div>

            <div className="bottom">
              <p className="text">{news.summary}</p>
              <div>
                <img src={news.img} alt="news-img" />
                <div className="etc">
                  {like ?
                    <div className="icon" onClick={handleLike}><IoMdHeart /></div>
                    :
                    <div className="icon" onClick={handleLike}><IoMdHeartEmpty /></div>
                  }
                  <div className="icon" onClick={() => {}}><LuLink2 /></div>
                  <div className="icon" onClick={() => {}}><LuExternalLink /></div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </MySummaryCategoryStyled>
    </>
  );
}

const MySummaryCategoryStyled = styled.div`


    @keyframes moveForward {
        0% {
            transform: translateX(0);
        }
        100% {
            transform: translateX(0.375rem);
        }
    }

    .content {
        height: 100%;
        margin-top: 3.75rem;
        scroll-margin-top: 7.4rem;

        .top {
            margin-top: 3.75rem;
            margin-bottom: 1.875rem;

            .category-name {
                font-size: ${({theme}) => theme.fontSize.medium};
                font-weight: ${({theme}) => theme.fontWeight.medium};
                margin-bottom: 1.25rem;
                color: ${({theme}) => theme.color.primary};

                &:hover {
                    svg {
                        animation: moveForward .7s linear infinite;
                    }
                }
            }

            .title-section {
                display: flex;
                flex-direction: row;
                gap: 0.5rem;

                .title-text {
                    font-size: ${({theme}) => theme.fontSize.large};
                    flex: 1;
                }
            }
        }
        
        .bottom {
            height: 100%;
            display: flex;
            flex-direction: row;
            gap: 1.25rem;

            .text {
                height: 100%;
                background-color: ${({theme}) => theme.color.surface};
                border: 1px solid ${({theme}) => theme.color.border};
                border-radius: ${({theme}) => theme.borderRadius.medium};
                padding: 1.25rem;
                color: ${({theme}) => theme.color.subtext};
            }

            img {
                width: 16rem;
                height: 11.75rem;
                border-radius: ${({theme}) => theme.borderRadius.medium};
                margin-bottom: 0.125rem;
            }

            .etc {
                display: flex;
                flex-direction: row;
                padding: 1.25rem;
                justify-content: center;
                gap: 1.25rem;

                .icon {
                    background-color: ${({theme}) => theme.color.colorBackground};
                    border-radius: ${({theme}) => theme.borderRadius.circle};
                    width: 2.75rem;
                    height: 2.75rem;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;

                    svg {
                        width: 1.5rem;
                        height: 1.5rem;
                        color: ${({theme}) => theme.color.primary};

                        &:hover {
                            color: ${({theme}) => theme.color.secondary};
                            transition: all .3s ease;
                        }
                    }
                }
            }
        }

    }

`;

export default MySummaryCategory;
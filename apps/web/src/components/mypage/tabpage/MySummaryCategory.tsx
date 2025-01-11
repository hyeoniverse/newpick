import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import { IoIosArrowForward } from "react-icons/io";
import { LuExternalLink } from "react-icons/lu";
import { LuLink2 } from "react-icons/lu";
import Link from "next/link";
import LikeIcon from "@/components/mypage/common(temporary)/LikeIcon";
import LinkCopyIcon from "@/components/mypage/common(temporary)/LinkCopyIcon";
import OrigLinkIcon from "@/components/mypage/common(temporary)/OrigLinkIcon";
import ThumbImg from "@/components/mypage/common(temporary)/ThumbImg";

function MySummaryCategory() {

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
              <div className="img-section">
                <ThumbImg src={news.img} />
                <div className="etc">
                  <LikeIcon />
                  <LinkCopyIcon />
                  <OrigLinkIcon />
                </div>
              </div>
              <p className="text">{news.summary}</p>
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
        max-width: 100%;
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
                flex: 2;
                height: 100%;
                background-color: ${({theme}) => theme.color.surface};
                border: 1px solid ${({theme}) => theme.color.border};
                border-radius: ${({theme}) => theme.borderRadius.medium};
                padding: 1.25rem;
                color: ${({theme}) => theme.color.subtext};
            }

            .img-section {
                flex: 1;

                .etc {
                    display: flex;
                    flex-direction: row;
                    padding-top: 1.25rem;
                    justify-content: center;
                    gap: 1rem;
                }
            }

            @media (max-width: 768px) {
                    flex-direction: column;

                    .text, .img-section {
                        flex: none;  /* flex 비율 대신 각자 100% 너비 (혹은 auto) */
                        width: 100%;
                    }
                
            }
        }
    }

    
`;

export default MySummaryCategory;
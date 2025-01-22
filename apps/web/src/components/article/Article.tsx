"use client"

import styled from "styled-components";
import SummaryTextBox from "@/components/common/article/SummaryTextBox";
import PopularArticle from "@/components/article/PopularArticle";
import ArticleContent from "@/components/article/content/ArticleContent";
import PrevNextArticle from "@/components/article/PrevNextArticle";
import LatestArticle from "@/components/article/LatestArticle";
import MobileLikeLinkButton from "@/components/article/MobileLikeLinkButton";
import CommentsSection from '@/components/article/CommentsSection';

interface Props {
  content: string;
}

function Article({content}: Props) {
  return (
    <ArticleStyled>
      <SummaryTextBox>{content}</SummaryTextBox>
      <div className="content-section">
        <ArticleContent className="content" />
        <PopularArticle className="popular" />
      </div>
      <PrevNextArticle className="prev-next" />
      <CommentsSection className="comments-section"/>
      <LatestArticle className="latest" />
      <MobileLikeLinkButton className="icons" />
    </ArticleStyled>
  );
}

const ArticleStyled = styled.div`
    margin: 4rem 0;
    position: relative;
    width: 100%;
    height: 100%;

    .content-section {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        gap: 2rem;
        margin: 2rem 0;
        height: 100%;


        .content {
            flex: 3;
        }

        .popular {
            flex: 1;
        }
    }
    
    .comments-section {
        margin: 4rem 0;
    }
    
    @media screen and ${({theme}) => theme.mediaQuery.tablet} {
        display: flex;
        flex-direction: column;

        .content-section {
            flex-direction: column;

            .content {
                border-bottom: 1px solid ${({theme}) => theme.color.border};
                margin-bottom: 2rem;
            }

            .popular {
                order: 4;
            }
        }
    }

    .induce {
        order: 1;
    }

    .prev-next {
        order: 2;
    }

    .latest {
        order: 3;
    }
`;

export default Article;
"use client"

import styled from "styled-components";
import SummaryTextBox from "@/components/common/article/SummaryTextBox";
import PopularArticle from "@/app/articles/detail/[slug]/_components/PopularArticle";
import ArticleContent from "@/app/articles/detail/[slug]/_components/content/ArticleContent";
import PrevNextArticle from "@/app/articles/detail/[slug]/_components/PrevNextArticle";
import LatestArticle from "@/app/articles/detail/[slug]/_components/LatestArticle";
import MobileLikeLinkButton from "@/app/articles/detail/[slug]/_components/MobileLikeLinkButton";
import CommentsSection from '@/app/articles/detail/[slug]/_components/CommentsSection';
import { IArticleDetail } from '@/models/articleDetail';

interface Props {
  summary: string;
  content: string;
  popular: IArticleDetail[];
  latest: IArticleDetail[];
}

function Article({summary, content, popular, latest}: Props) {
  return (
    <ArticleStyled>
      <SummaryTextBox>{summary}</SummaryTextBox>
      <div className="content-section">
        <ArticleContent className="content" content={content}/>
        <PopularArticle className="popular" popular={popular} />
      </div>
      <PrevNextArticle className="prev-next" />
      <CommentsSection className="comments-section"/>
      <LatestArticle className="latest" latest={latest} />
      <MobileLikeLinkButton className="icons" />
    </ArticleStyled>
  );
}

const ArticleStyled = styled.div`
    margin: 4rem 0;
    position: relative;
    width: 100%;
    height: auto;

    .content-section {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        gap: 2rem;
        margin: 2rem 0;

        .content {
            flex: 3;
        }

        .popular {
            flex: 1;
            margin-top: 2rem;
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
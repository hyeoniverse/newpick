'use client'

import styled from "styled-components";
import SubscribeInduce from "@/app/articles/detail/[slug]/_components/content/SubscribeInduce";
import Image from '@/components/common/Image';

interface NewsletterContentProps {
  content: string;
  flex?: number;
  className?: string;
  articleImage?: string;
}

function ArticleContent({content, flex, className, articleImage}: NewsletterContentProps) {
  return (
    <ContainerStyled flex={flex} className={className}>
      {articleImage &&
      <Image src={articleImage} alt={'image'} />
      }
      <NewsletterContentStyled>
          <div
            dangerouslySetInnerHTML={{ __html: content }}
          />
        <div className="content-bottom-margin" />
      </NewsletterContentStyled>
      <SubscribeInduce />
    </ContainerStyled>
  );
}

const ContainerStyled = styled.div<Omit<NewsletterContentProps, 'content'>>`
    position: relative;
    display: flex;
    flex-direction: column;
`

const NewsletterContentStyled = styled.article`
    position: relative;
    gap: 0.5rem;

    .content-bottom-margin {
        padding-bottom: 2rem;
    }

    * {
        margin-bottom: 0.5rem;
        word-break: break-word;
        line-height: 1.56;
    }

    h1, h2, h3, h4, h5, h6 {
        margin-top: 2rem;
    }

    p {
        color: ${({theme}) => theme.color.mediumGrey};
    }

    img {
        border-radius: ${({theme}) => theme.borderRadius.soft};
    }

    figure {
        margin: 0;
        width: 100%;

        img {
            margin-bottom: 0.25rem;
            width: 100%;
        }

        figcaption {
            font-size: ${({theme}) => theme.fontSize.extraSmall};
            color: ${({theme}) => theme.color.lightGrey};
        }
    }

    a {
        color: ${({theme}) => theme.color.primary};
        text-decoration: underline ${({theme}) => theme.color.primary};
        text-decoration-thickness: 2px;
    }
`;


export default ArticleContent;
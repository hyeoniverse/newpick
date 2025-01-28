import styled from "styled-components";
import DefaultImg from "@/components/common/DefaultImg";
import SubscribeInduce from "@/app/articles/detail/[slug]/_components/content/SubscribeInduce";

interface NewsletterContentProps {
  content: string;
  flex?: number;
  className?: string;
}

function ArticleContent({content, flex, className}: NewsletterContentProps) {
  return (
    <ContainerStyled flex={flex} className={className}>
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

const ContainerStyled = styled.div<NewsletterContentProps>`
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
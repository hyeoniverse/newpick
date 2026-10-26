'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { dateFormatter } from '@/utils/formatter';
import { mapIdToTitle } from '@/utils/mapInterests';

import styled from 'styled-components';
import { IoArrowBack } from 'react-icons/io5';
import Text from '@/components/common/Text';
import SummaryTextBox from '@/components/common/article/SummaryTextBox';
import PopularArticle from '@/app/articles/detail/[slug]/_components/PopularArticle';
import ArticleContent from '@/app/articles/detail/[slug]/_components/content/ArticleContent';
import PrevNextArticle from '@/app/articles/detail/[slug]/_components/PrevNextArticle';
import LatestArticle from '@/app/articles/detail/[slug]/_components/LatestArticle';
import MobileLikeLinkButton from '@/app/articles/detail/[slug]/_components/MobileLikeLinkButton';
import MoveButton from '@/components/common/MoveButton';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import LinkCopyIcon from '@/components/common/icons/LinkCopyIcon';
import Title from '@/components/common/Title';
import { useArticleContentQuery } from '@/hooks/useArticle';
import { useViewCount } from '@/hooks/useViewCount';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { DEFAULT_IMAGES } from '@/constants/images';
import { parseUrls } from '@/utils/parseArticles';
import Skeleton from '@/components/common/loader/Skeleton';


function Article() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const { data: articleContent } = useArticleContentQuery(slug);
  const increasedViewCount = useViewCount(Number(slug));

  if (!articleContent) {
    return null;
  }
  const newsletterHTML = stripCodeFence(articleContent.newsletter.contentAsHTML, 'html');
  const newsletterContent = articleContent.newsletter;
  const relatedNews = parseUrls(articleContent.newsletter.usedNews);

  return (
    <>
      <TitleSectionStyled>
        <MoveButton
          onClick={() => router.push(`/articles?categoryId=${newsletterContent.categoryId}`)}
          text="목록으로"
          frontIcon={<IoArrowBack />}
        />
        <div className="title-section">
          <Link href={`/articles?categoryId=${newsletterContent.categoryId}`} className="category">
            {mapIdToTitle([newsletterContent.categoryId])[0] || `#${newsletterContent.categoryId}`}
          </Link>
          <Title size="large" weight="semiBold" className="title">
            {newsletterContent.title}
          </Title>
          {newsletterContent.subtitle && (
            <Text size="medium" color="subText" className="subtitle">
              {newsletterContent.subtitle}
            </Text>
          )}
          <div className="info">
            <Text size="small" color="subText">
              {dateFormatter(newsletterContent.createdAt)}
            </Text>
            <Text size="small" color="subText">
              |&nbsp;&nbsp;조회수 {increasedViewCount ?? newsletterContent.viewcount}
            </Text>
          </div>
          <div className="icons">
            <BookmarkIcon newsId={newsletterContent.id} newsletterId={newsletterContent.id} />
            <LinkCopyIcon id={newsletterContent.id} />
          </div>
        </div>
      </TitleSectionStyled>
      <ArticleStyled>
        <Suspense fallback={<Skeleton />}>
          <SummaryTextBox>{newsletterContent.content}</SummaryTextBox>
        </Suspense>
        <div className="content-section">
          <Suspense fallback={<Skeleton />}>
            <ArticleContent
              className="content"
              content={newsletterHTML}
              articleImage={newsletterContent.imageUrl ?? `${DEFAULT_IMAGES.MONO}`}
              related={relatedNews}
            />
          </Suspense>
          <Suspense fallback={<Skeleton />}>
            <PopularArticle className="popular" />
          </Suspense>
        </div>
        <Suspense fallback={<Skeleton />}>
          <PrevNextArticle
            className="prev-next"
            prev={articleContent.previousNewsletter}
            next={articleContent.nextNewsletter}
          />
        </Suspense>
        {/*<CommentsSection className="comments-section"/>*/}
        <Suspense fallback={<Skeleton />}>
          <LatestArticle className="latest" />
        </Suspense>
        <MobileLikeLinkButton className="icons" newsId={newsletterContent.id} />
      </ArticleStyled>
    </>
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

    @media screen and ${({ theme }) => theme.mediaQuery.tablet} {
        display: flex;
        flex-direction: column;

        .content-section {
            flex-direction: column;

            .content {
                border-bottom: 1px solid ${({ theme }) => theme.color.border};
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

const TitleSectionStyled = styled.div`
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};

    .title-section {
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        margin: 1.25rem 0;

        .category {
            color: ${({ theme }) => theme.color.primary};
            font-weight: ${({ theme }) => theme.fontWeight.medium};
        }

        .title {
            word-break: auto-phrase;
        }

        .subtitle {
            word-break: auto-phrase;
            max-width: 40rem;
        }

        .icons {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            justify-content: center;
            align-items: center;
            margin-top: 0.75rem;
        }

        .info {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
        }
    }
`;

export default Article;

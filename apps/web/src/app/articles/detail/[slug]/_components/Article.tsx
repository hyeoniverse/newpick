'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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
import Tags from '@/components/common/Tags';
import { useArticleContentQuery } from '@/hooks/useArticle';
import { useViewCount } from '@/hooks/useViewCount';
import { useHeader } from '@/hooks/useHeader';
import { stripCodeFence } from '@/utils/stripCodeFence';
import { DEFAULT_IMAGES } from '@/constants/images';
import { parseUrls } from '@/utils/parseArticles';
import Skeleton from '@/components/common/loader/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { DELETED_NEWSLETTER, errorStateFor, statusOf } from '@/constants/errors';


function Article() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };

  const { data: articleContent, error, refetch } = useArticleContentQuery(slug);
  const increasedViewCount = useViewCount(Number(slug));
  const { isHeaderOpen } = useHeader();
  // 제목이 화면 위로 지나가면 '목록으로' 옆에 제목을 한 줄로 띄운다
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
  const [titlePassed, setTitlePassed] = useState(false);

  useEffect(() => {
    if (!titleEl) return;
    const observer = new IntersectionObserver(([entry]) =>
      setTitlePassed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(titleEl);
    return () => observer.disconnect();
  }, [titleEl]);

  // 서버 확인 뒤에 지워졌거나(404) 서버 오류면 빈 화면 대신 안내
  if (error) {
    const status = statusOf(error);
    return status === 404 ? (
      <ErrorState code={404} {...DELETED_NEWSLETTER} />
    ) : (
      <ErrorState code={status} {...errorStateFor(status)} onRetry={() => refetch()} />
    );
  }

  if (!articleContent) {
    return null;
  }
  const newsletterHTML = stripCodeFence(articleContent.newsletter.contentAsHTML, 'html');
  const newsletterContent = articleContent.newsletter;
  const relatedNews = parseUrls(articleContent.newsletter.usedNews);

  return (
    <>
      {/* 목록으로: 스크롤해도 따라온다. 헤더처럼 내릴 땐 화살표만 남기고 접고, 올릴 땐 펼친다.
          제목을 지나 읽는 중이면 옆에 제목을 한 줄로 (본문 h1이 따로 있어 화면 읽기에서는 빼 둔다) */}
      <BackBarStyled $folded={!isHeaderOpen} $withTitle={titlePassed}>
        <MoveButton
          className="back"
          onClick={() => router.push(`/articles?categoryId=${newsletterContent.categoryId}`)}
          text="목록으로"
          frontIcon={<IoArrowBack aria-hidden />}
        />
        <p className="bar-title" aria-hidden>
          <span>{newsletterContent.title}</span>
        </p>
      </BackBarStyled>
      <TitleSectionStyled>
        <div className="title-section">
          <Link href={`/articles?categoryId=${newsletterContent.categoryId}`} className="category">
            {mapIdToTitle([newsletterContent.categoryId])[0] || `#${newsletterContent.categoryId}`}
          </Link>
          <Title size="large" weight="semiBold" className="title" ref={setTitleEl}>
            {newsletterContent.title}
          </Title>
          {newsletterContent.subtitle && (
            <Text size="medium" color="subText" className="subtitle">
              {newsletterContent.subtitle}
            </Text>
          )}
          <Tags tags={newsletterContent.keywords} className="keywords" linkable />
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
        {/* 생성형 AI 결과물 표시 (인공지능 기본법 제31조, 이용약관 제5조) */}
        <Text as="p" size="extraSmall" color="subText" className="ai-notice">
          이 뉴스레터는 AI가 여러 언론사 기사를 요약·재구성했습니다. 수치·발언은 각 소식의 출처 기사를 함께 확인하세요.
        </Text>
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

    .ai-notice {
        margin: 0.5rem 0 0;
        line-height: 1.6;
        word-break: keep-all;
    }

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

/**
 * 화면에 붙는 '목록으로'. 페이지 흐름에선 지금 자리(제목 위)를 지키고, 스크롤하면 위에 붙는다.
 * 헤더가 펼쳐져 있으면 헤더(3rem) 아래, 접히면 맨 위로 같이 올라가며 글자를 접는다
 */
const BackBarStyled = styled.div<{ $folded: boolean; $withTitle: boolean }>`
    position: sticky;
    top: ${({ $folded }) => ($folded ? '0.75rem' : 'calc(3rem + 0.75rem)')};
    z-index: 900;
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    width: fit-content;
    max-width: min(100%, 44rem);
    margin-top: 4rem;
    transition: top 0.3s ease;

    /* 제목 한 줄: 버튼과 같은 높이의 칸, 배경을 깔아 본문 위에서도 읽히게 */
    .bar-title {
        display: flex;
        align-items: center;
        min-width: 0;
        padding: 0 0.875rem;
        border: 1px solid ${({ theme }) => theme.color.border};
        border-radius: ${({ theme }) => theme.radius.control};
        background: ${({ theme }) => theme.color.background};
        font-size: ${({ theme }) => theme.fontSize.small};
        font-weight: ${({ theme }) => theme.fontWeight.semiBold};
        color: ${({ theme }) => theme.color.text};

        span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        opacity: ${({ $withTitle }) => ($withTitle ? 1 : 0)};
        transform: translateY(${({ $withTitle }) => ($withTitle ? '0' : '-0.25rem')});
        visibility: ${({ $withTitle }) => ($withTitle ? 'visible' : 'hidden')};
        transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    }

    .back {
        background: ${({ theme }) => theme.color.background};
        gap: ${({ $folded }) => ($folded ? '0' : '0.5rem')};
        transition: gap 0.3s ease, padding 0.3s ease;
    }

    .move-text {
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        max-width: ${({ $folded }) => ($folded ? '0' : '5rem')};
        opacity: ${({ $folded }) => ($folded ? 0 : 1)};
        transition: max-width 0.3s ease, opacity 0.2s ease;
    }

    @media (prefers-reduced-motion: reduce) {
        &,
        .back,
        .move-text,
        .bar-title {
            transition: none;
        }
    }
`;

const TitleSectionStyled = styled.div`
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

        .keywords {
            justify-content: center;
            margin-top: 0.5rem;
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

'use client'

import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import { LuBookmark } from 'react-icons/lu';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import Skeleton from '@/components/common/loader/Skeleton';
import { errorStateFor, statusOf } from '@/constants/errors';
import Card from '@/components/common/Card';
import Text from '@/components/common/Text';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarksList } from '@/hooks/useBookmark';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';

function MyBookmark() {
  const { user } = useAuthStore();
  const { data: bookmarks, isPending, isError, error, refetch } = useBookmarksList();

  // 마이페이지는 로그인해야 들어오므로(가드) 사용자 정보를 받는 중이거나 목록을 받는 중이면 자리만 채운다 (#17)
  if (!user || isPending) {
    return (
      <MyBookmarkStyled aria-busy>
        <div className="trend-cards">
          <Skeleton />
        </div>
      </MyBookmarkStyled>
    );
  }

  if (isError) {
    return <ErrorState inline {...errorStateFor(statusOf(error))} onRetry={() => refetch()} />;
  }

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={LuBookmark}
        title="북마크한 뉴스레터가 없어요"
        description="마음에 드는 뉴스레터에서 북마크를 누르면 여기에 모여요."
        action={{ label: '뉴스레터 둘러보기', href: '/articles' }}
      />
    );
  }

  return (
    <>
      <MyBookmarkStyled>
        <div className="trend-cards">
          {bookmarks.map((bookmark) => (
              <Card
                key={bookmark.id}
                data={{
                  id: bookmark.id,
                  url: `/articles/detail/${bookmark.id}`,
                  image: `${getFirstImage(bookmark.newsImg)}`,
                  header: bookmark.category.name,
                  main: {
                    title: bookmark.newsTitle,
                    description: bookmark.newsSummary,
                  },
                  footer: (
                    <>
                      <Text color="subText">
                        {dateFormatter(bookmark.newsCreatedAt)}
                      </Text>
                      <div className="right">
                        <BookmarkIcon newsId={bookmark.id} newsletterId={bookmark.id} />
                      </div>
                    </>
                  ),
                }}
              />
          ))}
        </div>
      </MyBookmarkStyled>
    </>
  );
}

const MyBookmarkStyled = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 2rem 0;
    gap: 2rem;

    .trend-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        width: 100%;
        height: fit-content;
    }
`;

export default MyBookmark;

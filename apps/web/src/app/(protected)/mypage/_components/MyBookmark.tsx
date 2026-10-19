'use client'

import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import NoContentsPage from '@/components/common/NoContentsPage';
import Card from '@/components/common/Card';
import Text from '@/components/common/Text';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarksList } from '@/hooks/useBookmark';
import { dateFormatter } from '@/utils/formatter';
import { getFirstImage } from '@/utils/getFirstImage';

function MyBookmark() {
  const { user } = useAuthStore();
  const { data: bookmarks, isError, error } = useBookmarksList();

  if (!user) {
    return (
      <NoContentsPage
      text={`권한이 없습니다. \n 로그인 후 이용해주세요.`}
      btnText={'메인으로'}
      moveTo={'/'}
    />)
  }

  if (isError) {
    return <div>에러가 발생했습니다: {(error as Error).message}</div>;
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <NoContentsPage
        text={`북마크한 뉴스레터가 없습니다.\n 다른 뉴스레터를 찾아보세요.`}
        btnText={'오늘의 뉴스레터'}
        moveTo={'/'}
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

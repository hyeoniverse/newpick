"use client"

import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import NoContentsPage from '@/components/common/NoContentsPage';
import Card from '@/components/common/Card';
import Text from '@/components/common/Text';
import { useAuthStore } from '@/stores/useAuthStore';
// import { useBookmarkStore } from '@/stores/useBookmarkStore';
import { useEffect } from 'react';
import { useBookmarksList } from '@/hooks/useBookmark';
import { dateFormatter } from '@/utils/formatter';
import { bookmarkFirstImage } from '@/utils/getFirstImage';

function MyBookmark() {
  const { user } = useAuthStore();
  const { data: bookmarks, isLoading, isError, error } = useBookmarksList();
  console.log("IBookmarkItems");

  // 사용자 로그인 확인
  useEffect(() => {
    // user가 없으면 처리하기
  }, [user]);

  if (!user) {
    return <div>로그인 후 이용해주세요.</div>;
  }

  if (isLoading) {
    return <div>북마크를 불러오는 중입니다...</div>;
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
                image: `${bookmarkFirstImage(bookmark.newsImg)}`,
                header: `category`,
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
                      <BookmarkIcon newsId={bookmark.id} />
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

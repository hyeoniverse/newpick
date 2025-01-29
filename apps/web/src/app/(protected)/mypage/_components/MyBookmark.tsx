import styled from 'styled-components';
import BookmarkIcon from '@/components/common/icons/BookmarkIcon';
import NoContentsPage from '@/components/common/NoContentsPage';
import Card from '@/components/common/Card';
import Text from '@/components/common/Text';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBookmarkStore } from '@/stores/useBookmarkStore';
import { useEffect } from 'react';

function MyBookmark() {
  const { user } = useAuthStore();
  const {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
  } = useBookmarkStore();
  console.log("bookmarkItems");

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  if (!user) {
    return <div>로그인 후 이용해주세요.</div>;
  }

  if (isLoading) {
    return <div>북마크를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div>에러가 발생했습니다: {error}</div>;
  }

  if (bookmarks.length === 0) {
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
          {bookmarks.map((item) => (
            <Card
              key={item.newsId}
              data={{
                id: item.newsId,
                image: 'info.newsletterId',
                header: `newsletterId: ${item.newsletterId}`,
                main: {
                  title: `News #${item.newsId}`,
                  description: `Rating: ${item.rating}`,
                },
                footer: (
                  <>
                    <Text color="subText">
                      {item.newsId}
                    </Text>
                    <div className="right">
                      <BookmarkIcon newsId={item.newsId} />
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


    // display: grid;
    // justify-items: start;
    // justify-content: start;
    // gap: 3rem 2rem;
    // grid-template-columns: repeat(3, 1fr);
    //
    // .card {
    //     width: auto;
    //     height: 100%;
    //
    //     .content {
    //         display: flex;
    //         flex-direction: column;
    //         gap: 0.5rem;
    //         margin-top: 1rem;
    //
    //         .category {
        //             color: ${({ theme }) => theme.color.primary};
        //             font-size: ${({ theme }) => theme.fontSize.extraSmall};
        //             font-weight: ${({ theme }) => theme.fontWeight.medium};
    //             width: max-content;
    //         }
    //
    //         .title,
    //         .subText {
    //             display: -webkit-box;
    //             -webkit-box-orient: vertical;
    //             -webkit-line-clamp: 2;
    //             overflow: hidden;
    //             word-break: keep-all;
    //         }
    //
    //         .title {
        //             font-size: ${({ theme }) => theme.fontSize.large};
    //             line-height: 1.2;
    //             margin: 0;
    //         }
    //
    //         .subText {
        //             font-size: ${({ theme }) => theme.fontSize.extraSmall};
        //             color: ${({ theme }) => theme.color.mediumGrey}
    //         }
    //
    //         .etc {
    //             display: flex;
    //             flex-direction: row;
    //             align-items: center;
    //             justify-content: space-between;
    //
    //             .bar {
        //                 border-left: 1px solid ${({ theme }) => theme.color.border};
    //                 margin: 0 1.25rem;
    //                 height: 1.5rem;
    //             }
    //
    //             .date {
        //                 font-size: ${({ theme }) => theme.fontSize.extraSmall};
        //                 color: ${({ theme }) => theme.color.neutral};
    //             }
    //         }
    //     }
    // }
    //
        // @media (${({ theme }) => theme.mediaQuery.tablet}) {
    //     grid-template-columns: repeat(2, 1fr);
    // }
        // @media (${({ theme }) => theme.mediaQuery.mobile}) {
    //     grid-template-columns: repeat(1, 1fr);
    // }
`;

export default MyBookmark;

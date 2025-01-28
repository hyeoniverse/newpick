import styled from 'styled-components';
import InputText from '@/components/common/InputText';
import Button from '@/components/common/Button';
import { currentUserData } from '@/mocks';
import { dateFormatter } from '@/utils/formatter';
import { USER2 } from '@/lib/mypageData';
import { useState } from 'react';

interface Props {
  className?: string;
}

function CommentsSection({ className }: Props) {
  const { feedback } = currentUserData
  const [ auth, setAuth ] = useState(false);

  const handleAuth = () => {
    if (auth) {
      setAuth(false);
    } else {
      setAuth(true);
    }
  }

  return (
    <CommentsSectionStyled className={className}>
      {/*<Button onClick={handleAuth}>auth</Button>*/}
      <h3>댓글</h3>
      <div className="input-section">
        <InputText placeholder={auth ? '자유롭게 의견을 남겨보세요.' : '로그인하고 자유롭게 의견을 남겨주세요.'} />
        <Button scheme="primary" size="medium">작성하기</Button>
      </div>
      <div className="comments-list">
        {feedback.map((comment, index) => (
          <div key={index} className="comment-item">
            <div className="user">
              <div className="user-info">
                <div className="user-image"></div>
                <div className="user-name">{comment.userId}</div>
              </div>
              {comment.userId === USER2.id && (
                <div className="buttons">
                  <Button scheme="monoOutline">수정</Button>
                  <Button scheme="mono">삭제</Button>
                </div>
              )}
            </div>
            <div className="comment">
              {comment.comments}
            </div>
            <div className="date">
              {dateFormatter(comment.createdAt)}
            </div>
          </div>
        ))}

      </div>
    </CommentsSectionStyled>
  );
}

const CommentsSectionStyled = styled.section`
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .input-section {
        display: flex;
        gap: 1rem;
        height: 3rem;

        input, button {
            height: 100%;
        }

        input::placeholder {
            color: ${({ theme }) => theme.color.lightGrey}
        }
    }

    .comments-list {
        .user {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .user-info {
                display: flex;
                gap: 1rem;
                align-items: center;
                
                .user-image {
                    width: 2rem;
                    height: 2rem;
                    background-color: ${({ theme }) => theme.color.neutral};
                    border-radius: ${({ theme }) => theme.borderRadius.circle};
                }

                .user-name {
                    color: ${({ theme }) => theme.color.mediumGrey};
                    font-size: ${({ theme }) => theme.fontSize.extraSmall};
                }
            }

            .buttons {
                display: flex;
                gap: 0.75rem;
            }
        }

        .comment-item {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            border-bottom: 1px solid ${({ theme }) => theme.color.border};
            padding: 2rem 0;

            .comment {
                color: ${({ theme }) => theme.color.text};
            }

            .date {
                display: flex;
                justify-content: space-between;
                color: ${({ theme }) => theme.color.lightGrey};
                font-size: ${({ theme }) => theme.fontSize.extraSmall};
            }
        }
    }
`;

export default CommentsSection;
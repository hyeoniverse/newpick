'use client'

import styled from 'styled-components';
import BorderTitle from '@/components/common/BorderTitle';
import Img from 'next/image';

interface Props {
  className?: string;
}

function HowToUseSection({ className }: Props) {
  return (
    <HowToUseSectionStyled className={className}>
      <BorderTitle text="HOW TO USE" />
      <p className="sub-text">
        간편한 소셜로그인과 직관적인 카테고리 선택만 해주시면
        <br />
        일정에 맞춰 뉴스레터를 발송해드립니다.
      </p>
      <div className="sns">
        <p className="img-text">SNS 로그인</p>
        <Img
          src={'/img/about_sns-login.jpg'}
          alt={'sns-login'}
          className="sns-img"
          width={0}
          height={0}
          sizes="100vw"
        />
      </div>
      <div className="categories">
        <p className="img-text">관심 카테고리 선택</p>
        <Img
          src={'/img/about_categories.jpg'}
          alt={'categories'}
          className="categories-img"
          width={0}
          height={0}
          sizes="100vw"
        />
      </div>
      <div className="newsletter-mail">
        <p className="img-text">뉴스레터 받기</p>
        <Img
          src={'/img/about_newsletter-mail.jpg'}
          alt={'newsletter-mail'}
          className="newsletter-mail-img"
          width={0}
          height={0}
          sizes="100vw"
        />
      </div>

    </HowToUseSectionStyled>
  );
}

const HowToUseSectionStyled = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    .sub-text {
        line-height: 1.8;
        margin-bottom: 4rem;
    }

    .img-text {
        margin-bottom: 1rem;
        font-weight: ${({ theme }) => theme.fontWeight.medium}
    }

    .sns {
        width: 100vw;
        margin-left: calc(50% - 40vw);
        margin-right: calc(50% - 40vw);
        
        .sns-img {
            width: 50%;
            height: auto;
        }

        .img-text {
            margin-bottom: 1rem;
            font-weight: ${({ theme }) => theme.fontWeight.medium}
            width: 50%;
        }
    }

    .categories {
        width: 100vw;
        margin-left: calc(50% - 0vw);
        margin-right: calc(50% - 0vw);

        .categories-img {
            width: 50%;
            height: auto;
        }
    }

    .newsletter-mail {
        //width: 100vw;
        //margin-left: calc(50% - 0vw);
        //margin-right: calc(50% - 0vw);

        .newsletter-mail-img {
            border: 1px solid ${({ theme }) => theme.color.border};
            width: 70%;
            height: auto;
        }
    }

`;

export default HowToUseSection;
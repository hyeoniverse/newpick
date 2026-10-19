'use client'

import styled from 'styled-components';
import BorderTitle from '@/components/common/BorderTitle';

interface Props {
  className?: string;
}

function WhyNewpickSection({ className }: Props) {
  return (
    <WhyNewpickSectionStyled className={className}>
      <BorderTitle text="WHY NEWPICK?" />
      <div>
        <p className="sub-text">
          매일 새로운 소식, 중요한 소식이 쏟아지지만 모두 챙기기 힘드셨다면?
          <br />
          NEWPICK은 AI 큐레이션을 통해 원하는 분야의 뉴스만 골라서
          <br />
          간편하고 빠르게 받아볼 수 있도록 도와드립니다.
        </p>
      </div>
      <div className="design-text">
        VALUE PROPOSITION
      </div>
      <div className="value-text">
        <p><strong>최신 트렌드</strong>와 이슈를 놓치지 않도록</p>
        <p><strong>빠르고 정확하게</strong> 뉴스를 습득할 수 있도록</p>
        <p>나만의 관심 분야를 <strong>더 깊이 탐구</strong>할 수 있도록</p>
      </div>
    </WhyNewpickSectionStyled>
  );
}

const WhyNewpickSectionStyled = styled.div`
    .sub-text {
        line-height: 1.8;
        margin-bottom: 8rem;
    }

    .design-text {
        font-size: 5.125rem;
        font-weight: 800;
        color: ${({ theme }) => theme.color.neutral};
        letter-spacing: 10px;
        justify-self: center;
        margin-bottom: 2rem;
    }

    .value-text {
        align-self: center;
        text-align: center;

        p {
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
    }

    p {
        color: ${({ theme }) => theme.color.mediumGrey};
    }
`;

export default WhyNewpickSection;

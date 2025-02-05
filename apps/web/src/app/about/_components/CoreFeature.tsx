'use client'

import styled from 'styled-components';
import Title from '@/components/common/Title';
import { TbMailAi, TbMailCheck, TbMailShare } from 'react-icons/tb';
import Img from 'next/image';

interface Props {
  className?: string;
}

function CoreFeature({ className }: Props) {
  return (
    <CoreFeatureStyled className={className}>
      <div className="background" />
      <div className="inner">
        <Title size="extraSmall" weight="semiBold">CORE FEATURE</Title>
        <div className="core-feature">
          <div className="core-item">
            <TbMailAi />
            <h4>AI 큐레이션</h4>
            <p>방대한 기사 중 필요한 정보만 추출, 요약</p>
            <Img
              src={'/img/about_curation.jpg'}
              alt={'ai-curation'}
              width={0}
              height={0}
              sizes="100vw"
            />
          </div>
          <div className="core-item">
            <TbMailCheck />
            <h4>맞춤 구독</h4>
            <p>원하는 분야만 선택해 구독 가능</p>
            <Img src={'/img/about_subscribe.jpg'} alt={'subscribe'}               width={0}
                 height={0}
                 sizes="100vw" />
          </div>
          <div className="core-item">
            <TbMailShare />
            <h4>자동 발송</h4>
            <p>지정된 주기에 맞춰 이메일로 전달</p>
            <Img src={'/img/about_send.jpg'} alt={'send'}               width={0}
                 height={0}
                 sizes="100vw" />
          </div>
        </div>
      </div>

    </CoreFeatureStyled>
  );
}

const CoreFeatureStyled = styled.div`
    position: relative;
    width: 100%;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        width: 100vw;
        height: 100%;
        background-color: ${({ theme }) => theme.color.surface};
        transform: translateX(-50%);
        left: 50%;
        z-index: -1;
    }

    .inner {
        margin: 6rem 0;

        h1 {
            font-size: 1.25rem;
            margin-bottom: 4rem;
        }
    }

    .core-feature {
        display: flex;
        justify-content: space-between;
        gap: 2rem;

        .core-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;

            svg {
                width: 2rem;
                height: 2rem;
                color: ${({ theme }) => theme.color.primary};
            }

            img {
                border-radius: ${({ theme }) => theme.borderRadius.soft};
                width: 100%;
                height: auto;
            }
        }
    }

`;

export default CoreFeature;
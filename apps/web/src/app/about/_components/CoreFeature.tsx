'use client'

import styled from 'styled-components';
import Title from '@/components/common/Title';
import { TbMailAi, TbMailCheck, TbMailShare } from 'react-icons/tb';

interface Props {
  className?: string;
}

function CoreFeature({ className }: Props) {
  return (
    <CoreFeatureStyled className={className}>
      <div className="background" />
      <div className="inner">
        <Title size="extraSmall" weight="semiBold">CORE FEATURE</Title>
      </div>
      <div>
        <div>
        <TbMailAi />
          <h4>AI 큐레이션</h4>
          <p>방대한 기사 중 필요한 정보만 추출, 요약</p>
        </div>
        <TbMailCheck />
        <TbMailShare />
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
        }
    }

`;

export default CoreFeature;
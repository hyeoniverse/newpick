'use client'

import styled from 'styled-components';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Image from '@/components/common/Image';

interface Props {
  className?: string;
}

function Logos({ className }: Props) {
  const logoPaths1 = Array.from({ length: 6 }, (_, idx) => `/img/logos/${idx + 1}.jpg`);
  const logoPaths2 = Array.from({ length: 13 - 7 + 1 }, (_, idx) => `/img/logos/${idx + 7}.jpg`);

  const extendedLogoPaths1 = [...logoPaths1, ...logoPaths1, ...logoPaths1];
  const extendedLogoPaths2 = [...logoPaths2, ...logoPaths2, ...logoPaths2];


  return (
    <LogosStyled className={className}>
      <Swiper
        dir={'rtl'}
        modules={[ Autoplay ]}
        loop={true} // 슬라이드 루프
        loopAdditionalSlides={12}
        spaceBetween={20} // 슬라이스 사이 간격
        slidesPerView={'auto'} // 보여질 슬라이스 수
        autoplay={{
          delay: 0,
          stopOnLastSlide: false,
          disableOnInteraction: false,
        }}
        observer={true}
        observeParents={true}
        speed={4000}
      >
        {extendedLogoPaths1.map((src, i) => (
          <SwiperSlide key={i} className="swiper-slide">
            <Image
              src={src}
              alt="logo"
              ratio="square"
              className="logo"
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <Swiper
        dir={'ltr'}
        modules={[ Autoplay ]}
        loop={true} // 슬라이드 루프
        loopAdditionalSlides={1}
        spaceBetween={20} // 슬라이스 사이 간격
        slidesPerView={'auto'} // 보여질 슬라이스 수
        autoplay={{
          delay: 0,
          stopOnLastSlide: false,
          disableOnInteraction: false,
        }}
        observer={true}
        observeParents={true}
        speed={4000}
      >
        {extendedLogoPaths2.map((src, i) => (
          <SwiperSlide key={i} className="swiper-slide">
            <Image
              src={src}
              alt="logo"
              ratio="square"
              className="logo"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </LogosStyled>
  );
}

const LogosStyled = styled.div`
    margin: 2rem 0;
    .swiper {
        width: 100vw;
        height: 100%;
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        position: relative;
        overflow: hidden;
        margin-bottom: 2rem;

        .swiper-wrapper {
            transition-timing-function: linear !important;
            padding-right: calc(50% - 50vw);

            position: relative;
            display: flex;

            .swiper-slide {
                width: auto;
            }
        }

        .logo {
            width: 260px;
            height: 120px;
        }
    }
`;

export default Logos;
'use client'

import styled from "styled-components";
import { SyntheticEvent } from "react";
import Image from "next/image";

interface ResponsiveImageStyleProps {
  aspectratio?: number | "auto";
}


interface Props extends ResponsiveImageStyleProps {
  src?: string | null;
  height?: string;
  className?: string;
}

function HeightAutoImg({src, height, className, aspectratio = "auto"}: Props) {

  const imageOnErrorHandler = (e: SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/img/newpick_default_img.jpg";
  }
  return (
    <ContainerStyled height={height} className={className} aspectratio={aspectratio} >
      <SourceStyled />
      {/*  type="image/webp"*/}
      {/*  src={validSrc}*/}

      <ThumbImgStyled
        src={src}
        alt="news-img"
        loading="lazy"
        quality={75}
        sizes="100vw"
        fill
        onError={imageOnErrorHandler}
      />
    </ContainerStyled>
  );
}


const ThumbImgStyled = styled(Image)<Props>`
    position: relative !important;
    display: block;
    height: unset !important;
    width: 100%;

    max-height: 24rem;
    min-height: 2rem;

    object-fit: cover;
    content-visibility: auto;
    object-position: center;
`;

const SourceStyled = styled.source`
`

const ContainerStyled = styled.div<Props>`
    overflow: hidden;
    border-radius: ${({theme}) => theme.borderRadius.soft};

    height: ${({height}) => height};

    ${ThumbImgStyled} {
        aspect-ratio: ${({aspectratio}) => aspectratio};
    }
`

export default HeightAutoImg;
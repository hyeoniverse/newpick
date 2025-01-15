import styled from "styled-components";
import { SyntheticEvent } from "react";

interface ThumbImgProps {
  src: string | null;
  height?: string;
}

// height가 없을 경우 높이값 가변
function ThumbImg({src, height}: ThumbImgProps) {
  const imageOnErrorHandler = (e: SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/img/newpick_default_img.jpg";
  };

  const validSrc = src ?? "/img/newpick_default_img.jpg";

  return (
    <ContainerStyled height={height}>
      <SourceStyled
        type="image/webp"
        src={validSrc}
      />
      <ThumbImgStyled
        src={src}
        alt="news-img"
        onError={imageOnErrorHandler}
        loading='lazy'

      />
    </ContainerStyled>
  );
}

const ContainerStyled = styled.picture<Omit<ThumbImgProps, "src">>`
    position: relative;
    display: block;
    border-radius: ${({theme}) => theme.borderRadius.medium};
    margin-bottom: 1.25rem;
    height: ${({height}) => height || "auto"};
    overflow: hidden;
    aspect-ratio: auto;
    width: 100%;
`

const SourceStyled = styled.source<ThumbImgProps>`
`

const ThumbImgStyled = styled.img<ThumbImgProps>`
    display: block;
    object-fit: cover;
    vertical-align: middle;
    object-position: center;
    height: 100%;
    width: 100%;
    max-height: 28rem;
    min-height: 2rem;
    content-visibility : auto;
`;

export default ThumbImg;
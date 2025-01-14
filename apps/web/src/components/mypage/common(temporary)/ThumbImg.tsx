import styled from "styled-components";

interface ThumbImgProps {
  src: string | null;
  height?: string;
}

// height가 없을 경우 높이값 가변
function ThumbImg({src, height}: ThumbImgProps) {
  return (
    <ContainerStyled height={height} >
      <ThumbImgStyled
        src={src}
        alt="news-img"
        sizes="(max-width: 800px) 100vw, 50vw"
      />
    </ContainerStyled>
  );
}

const ContainerStyled = styled.div<Omit<ThumbImgProps, "src">>`
    position: relative;
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    margin-bottom: 1.25rem;
    height: ${({ height }) => height || 'auto'};
    overflow: hidden;
    aspect-ratio: auto;

`

const ThumbImgStyled = styled.img<ThumbImgProps>`
    display: block;
    object-fit: cover;
    vertical-align: middle;
    height: 100%;
    width: 100%;
    max-height: 30rem;
    min-height: 2rem;
`;

export default ThumbImg;
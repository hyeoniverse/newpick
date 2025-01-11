import styled from "styled-components";

interface ThumbImgProps {
  src: string;
  width?: string;
  height?: string;
}

function ThumbImg({src, width, height}: ThumbImgProps) {
  return (
    <ThumbImgStyled src={src} width={width} height={height} alt="news-img" />
  );
}

const ThumbImgStyled = styled.img<ThumbImgProps>`
    width: ${(props) => props.width};
    height: ${(props) => props.height || "auto"};
    border-radius: ${({theme}) => theme.borderRadius.medium};
    margin-bottom: 1.25rem;
    display: block;
    max-width: 100%;
`;

export default ThumbImg;
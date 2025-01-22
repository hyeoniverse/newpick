import styled from "styled-components";
import Image from "next/image";

function DefaultImg() {
  return (
    <DefaultImgStyled>
      <Image
        src="/img/newpick_default_img.jpg"
        alt="default-img"
        fill
        className="img"
        loading="lazy"
        quality={75}
        sizes="100vw"
      />
    </DefaultImgStyled>
  );
}

const DefaultImgStyled = styled.div`
    position: relative;
    width: 100%;
    margin-bottom: 1.25rem;
    
    .img {
        position: relative !important;
        display: block;
        height: auto !important;
        width: 100%;

        object-fit: cover;
        content-visibility: auto;
        object-position: center;
    }
`

export default DefaultImg;
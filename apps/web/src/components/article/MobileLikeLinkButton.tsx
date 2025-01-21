import styled from "styled-components";
import { useEffect, useState } from "react";
import LikeIcon from "@/components/common/icons/LikeIcon";
import LinkCopyIcon from "@/components/common/icons/LinkCopyIcon";

interface Props {
  className?: string;
}

function MobileLikeLinkButton({className}: Props) {
  const [ showButton, setShowButton ] = useState(false)

  useEffect(() => {

    const handleScroll = () => {
      const footer = document.getElementById("footer-el");
      if (!footer) return;

      const footerTop = footer.offsetTop;
      const scrollBottom = window.scrollY + window.innerHeight;

      if (scrollBottom > footerTop) {
        setShowButton(false);
      } else {
        setShowButton(window.scrollY > 100);
      }
    };

    // 컴포넌트 마운트 시 스크롤 이벤트 등록
    window.addEventListener("scroll", handleScroll);
    // 언마운트 = 해제
    return () => {
      window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <MobileLikeLinkButtonStyled className={className}>
      <LikeIcon className={`mobile-icon blur ${showButton ? "fade-in " : "fade-out"}`} />
      <LinkCopyIcon className={`mobile-icon blur ${showButton ? "fade-in " : "fade-out"}`} />
    </MobileLikeLinkButtonStyled>
  );
}

const MobileLikeLinkButtonStyled = styled.div`
    display: flex;
    flex-direction: column;
    height: auto;
    position: fixed;
    bottom: 7.25rem;
    right: 1.5rem;
    z-index: 999;
    gap: 0.75rem;

    .mobile-icon {
        height: 2.5rem;
        width: 2.5rem;
        cursor: pointer;
        color: ${({theme}) => theme.color.primary};
        background: ${({theme}) => theme.color.background};
        border: 0.5px solid ${({theme}) => theme.color.border};
        border-radius: ${({theme}) => theme.borderRadius.flat};

        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;

        &.fade-in {
            opacity: 80%;
            transform: translateY(0);
        }

        &.fade-out {
            opacity: 0;
            transform: translateY(60px);
        }

        svg {
            position: absolute;
            width: 1.25rem;
            height: 1.25rem;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }

    }

`;

export default MobileLikeLinkButton;
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
    bottom: 6.25rem;
    right: 1.5rem;
    z-index: 999;
    gap: 0.75rem;
    
    .mobile-icon {
        height: 4rem;
        width: 4rem;
        cursor: pointer;
        background-color: ${({theme}) => theme.color.background}50;
        border-radius: ${({theme}) => theme.borderRadius.circle};
        border: 1px solid ${({theme}) => theme.color.border};

        backdrop-filter: blur(3px);
        
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
import styled from "styled-components";
import SubscribeInfo from "@/components/mypage/tabpage/SubscribeInfo";
import MySummaryCategory from "@/components/mypage/tabpage/MySummaryCategory";
import { useLayoutEffect, useState } from "react";

function MySubscribe() {
  const [ activeCategory, setActiveCategory ] = useState<string>("");

  useLayoutEffect(() => {
    const categories = document.querySelectorAll<HTMLElement>(".content");
    let sectionPositions: number[] = [];

    const calcPositions = () => {
      sectionPositions = Array.from(categories).map((cat) => cat.offsetTop);
    };

    const handleScroll = () => {
      const currentScroll = window.scrollY - 110; // 높이 더하기 빼기 조절 (nav 높이값)
      let activeIndex = 0;

      for (let i = 0; i < sectionPositions.length; i++) {
        if (sectionPositions[i] <= currentScroll) {
          activeIndex = i;
        }
      }
      setActiveCategory(categories[activeIndex]?.id || "");
    };

    // 처음 셋팅
    calcPositions();
    handleScroll();

    // 스크롤, 리사이즈 이벤트 등록
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", () => {
      calcPositions();
      handleScroll();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", calcPositions);
    };
  }, []);

  return (
    <>
      <SubscribeInfo activeCategory={activeCategory} />
      <MySubscribeStyled>
        <MySummaryCategory />
      </MySubscribeStyled>
    </>
  );
}

const MySubscribeStyled = styled.div`
    position: relative;
    max-width: 1024px;
    margin: 0 auto;

`;

export default MySubscribe;
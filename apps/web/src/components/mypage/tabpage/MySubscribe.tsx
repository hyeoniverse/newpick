import styled from "styled-components";
import MySubscribeNav from "@/components/mypage/tabpage/MySubscribeNav";
import MySubscribeContents from "@/components/mypage/tabpage/MySubscribeContents";
import { useEffect, useState } from "react";
import NoContentsPage from "@/components/mypage/common(temporary)/NoContentsPage";
import { USER1, USER2, USER3 } from "@/constants/mypageData";
import { IMySummary } from "@/models/newsDetail";

function MySubscribe() {
  const [ activeCategory, setActiveCategory ] = useState<string>("");

  const [ summaryInfo, setSummaryInfo ] = useState<IMySummary[] | null>(null)

  useEffect(() => {
    async function fetchSummary() {

      console.log("Params:", summaryInfo); // 값 확인
      try {
        const res = await fetch(`http://localhost:3001/mysummary`);
        if (!res.ok) {
          throw new Error("No such news found");
        }
        const data = await res.json();
        setSummaryInfo(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchSummary();
  }, []);

  useEffect(() => {
    if (!summaryInfo) return;

    const categories = document.querySelectorAll<HTMLElement>(".my-subs-content");
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

    const handleResize = () => {
      calcPositions();
      handleScroll();
    };

    // 처음 셋팅
    calcPositions();
    handleScroll();

    // 스크롤, 리사이즈 이벤트 등록
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [summaryInfo]);

  return (
    <>
      {(USER1.subscribe === 1 || USER1.subscribe === 2) ? // 구독 중 이거나 일시정지 중 이거나
        (
          <>
            <MySubscribeNav activeCategory={activeCategory} />
            <MySubscribeStyled>
              <MySubscribeContents summaryInfo={summaryInfo} />
            </MySubscribeStyled>
          </>
        )
        :
        (
          <NoContentsPage
            text={`뉴스레터를 구독 중이 아닙니다. \n 새로운 뉴스레터 구독을 시작해보시겠습니까?`}
            btnText={"구독 바로가기"}
            moveTo={"/"}
          />
        )
      }
    </>
  );
}

const MySubscribeStyled = styled.div`
    position: relative;
    max-width: 1024px;
    margin: 0 auto;

`;

export default MySubscribe;
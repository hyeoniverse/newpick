"use client";

import styled from "styled-components";
import MySubscribeNav from "@/components/mypage/inner-page/MySubscribe/MySubscribeNav";
import MySubscribeContents from "@/components/mypage/inner-page/MySubscribe/MySubscribeSummaryCategory";
import { useEffect, useState } from "react";
import NoContentsPage from "@/components/common/NoContentsPage";
import { USER1 } from "@/lib/mypageData";
import { IMySummary } from "@/models/newsDetail";
import MySummaryCategory from "@/components/mypage/inner-page/MySubscribe/MySubscribeSummaryCategory";

function MySubscribe() {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [summaryInfo, setSummaryInfo] = useState<IMySummary[] | null>(null);

  // 데이터 Fetch
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`http://localhost:3001/mysummary`);
        if (!res.ok) {
          throw new Error("No such article found");
        }
        const data = await res.json();
        setSummaryInfo(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSummary();
  }, []);

  // 2) IntersectionObserver로 현재 화면에 나타난 섹션 감지
  useEffect(() => {
    if (!summaryInfo) return;

    const sections = document.querySelectorAll<HTMLElement>(".my-subs-content");
    const visibleSet = new Set<HTMLElement>();
    // 현재 화면에 들어와 있는 섹션들을 저장해둘 Set

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 화면에 보이는 섹션이면 Set에 추가
          visibleSet.add(entry.target as HTMLElement);
        } else {
          // 뷰포트에서 벗어나면 Set에서 제거
          visibleSet.delete(entry.target as HTMLElement);
        }
      });

      // 이제 visibleSet에는 "현재 보이는 섹션들"이 들어 있음
      if (visibleSet.size > 0) {
        // array로 변환 후, 가장 위에 있는 순서대로 정렬
        const sorted = Array.from(visibleSet).sort((a, b) => {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });
        // "가장 위에 있는" 섹션의 id로 activeCategory 설정
        setActiveCategory(sorted[0].id);
      }
    }, {
      threshold: 0.3,  // 얼마나 보여야 isIntersecting 처리할지
      rootMargin: "0px 0px -10% 0px",
      /*
        아래쪽에 살짝 여유를 두면,
        아직 완전히 벗어나지 않았어도 빠지는 것으로 처리할 수 있음.
        (레이아웃에 맞춰 조정)
      */
    });

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [summaryInfo]);


  // 3) 구독중이면 네비 + 컨텐츠 표시, 아니면 NoContentsPage 표시
  return (
    <>
      {(USER1.subscribe === 1 || USER1.subscribe === 2) ? (
        <>
          <MySubscribeNav activeCategory={activeCategory} />
          <MySubscribeStyled>
            <MySummaryCategory summaryInfo={summaryInfo} />
          </MySubscribeStyled>
        </>
      ) : (
        <NoContentsPage
          text={`뉴스레터를 구독 중이 아닙니다. \n 새로운 뉴스레터 구독을 시작해보시겠습니까?`}
          btnText={"구독 바로가기"}
          moveTo={"/"}
        />
      )}
    </>
  );
}

const MySubscribeStyled = styled.div`
    position: relative;
    max-width: 1024px;
    margin: 0 auto;
`;

export default MySubscribe;

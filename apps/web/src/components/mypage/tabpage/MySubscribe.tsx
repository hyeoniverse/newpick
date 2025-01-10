import styled from "styled-components";
import SubscribeInfo from "@/components/mypage/tabpage/SubscribeInfo";
import MySummaryCategory from "@/components/mypage/tabpage/MySummaryCategory";
import { useEffect, useLayoutEffect, useState } from "react";

function MySubscribe() {
  const [ activeCategory, setActiveCategory ] = useState<string>('');


  useLayoutEffect(() => {
    const categories = document.querySelectorAll<HTMLElement>('.content');

    const options = {
      root: null,
      rootMargin: '110px 0px 0px 0px',
      threshold: 0.74,
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveCategory(entry.target.id);
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, options);

    categories.forEach(category => {
      observer.observe(category);
    });
    //
    //
    // if (categories[0]) {
    //   setActiveCategory(categories[0].id);
    // }

    // 윈도우 리사이즈 시 옵저버 재설정
    const handleResize = () => {
      observer.disconnect();
      categories.forEach(category => {
        observer.observe(category);
      });
    };

    window.addEventListener('resize', handleResize);


    return () => {
      categories.forEach(category => {
        observer.unobserve(category);
      })
      window.removeEventListener('resize', handleResize);

    }
  }, []);

  return (
    <>
      <SubscribeInfo activeCategory={activeCategory}/>
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
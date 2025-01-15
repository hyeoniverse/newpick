"use client"

import styled from "styled-components";
import NoContentsPage from "@/components/mypage/common(temporary)/NoContentsPage";
import NewsletterSubscribe from "@/components/mypage/common(temporary)/NewsletterSubscribe";
import { USER1 } from "@/constants/mypageData";


function MyNewsSetting() {

  return (
    <MyNewsletterSettingStyled>
      {USER1.subscribe === 1 ?
        <NewsletterSubscribe />
        :
        <NoContentsPage
          text={`뉴스레터 구독이 일시정지 중 입니다. \n 구독을 다시 시작하시겠습니까?`}
          btnText={"일시정지 해제하기"}
          onClick={() => {}}
        />
      }
    </MyNewsletterSettingStyled>
  );
}

const MyNewsletterSettingStyled = styled.div`

`;

export default MyNewsSetting;
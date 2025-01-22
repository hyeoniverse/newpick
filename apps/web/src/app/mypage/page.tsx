"use client";

import styled from "styled-components";
import MyProfile from "@/components/mypage/profile/MyProfile";
import TabButton from "@/components/mypage/TabButton";
import MySubscribe from "@/components/mypage/mySubscribe/MySubscribe";
import { useState } from "react";
import MyBookmark from "@/components/mypage/MyBookmark";
import MyNewsletterSetting from "@/components/mypage/MyNewsletterSetting";

function Page() {
  const [ activeTab, setActiveTab ] = useState("subscribe");

  return (
    <PageStyled>
      <p className="title">마이페이지</p>
      <MyProfile />
      <TabButton activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="tab-contents">
        {activeTab === "subscribe" && (<MySubscribe />)}
        {activeTab === "bookmark" && (<MyBookmark />)}
        {activeTab === "newsletterSetting" && (<MyNewsletterSetting />)}
      </div>
    </PageStyled>
  );
}

const PageStyled = styled.div`
    margin: 3rem 0 10rem 0;
    
    .title {
        font-size: ${({theme}) => theme.fontSize.large};
        margin-bottom: 1.25rem;
        font-weight: ${({theme}) => theme.fontWeight.medium};
    }
`;

export default Page;

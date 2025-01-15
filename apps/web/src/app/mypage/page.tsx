"use client";

import styled from "styled-components";
import MyProfile from "@/components/mypage/profile/MyProfile";
import TabBtn from "@/components/mypage/TabBtn";
import MySubscribe from "@/components/mypage/tabpage/MySubscribe";
import { useState } from "react";
import MyBookmark from "@/components/mypage/tabpage/MyBookmark";
import MyNewsSetting from "@/components/mypage/tabpage/MyNewsSetting";

function Page() {
  const [ activeTab, setActiveTab ] = useState("subscribe")

  return (
    <PageStyled>
      <p className="title">마이페이지</p>
      <MyProfile />
      <TabBtn activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="tab-contents">
        {activeTab === "subscribe" && (<MySubscribe />)}
        {activeTab === "bookmark" && (<MyBookmark />)}
        {activeTab === "newsletterSetting" && (<MyNewsSetting />)}
      </div>

    </PageStyled>
  );
}

const PageStyled = styled.div`
    margin: 40px 0;

    .title {
        font-size: ${({theme}) => theme.fontSize.large};
        margin-bottom: 1.25rem;
        font-weight: ${({theme}) => theme.fontWeight.medium};
    }
`;

export default Page;
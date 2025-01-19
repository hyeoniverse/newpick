"use client"

import styled from "styled-components";
import { useParams } from "next/navigation";
import TitleSection from "@/components/article/content-inner/TitleSection";
import { useEffect, useState } from "react";
import { INewsDetail } from "@/models/newsDetail";
import { dateFormatter } from "@/utils/formatter";
import Article from "@/components/article/Article";

function NewsletterDetailPage() {
  const [ newsInfo, setNewsInfo ] = useState<INewsDetail | null>(null)
  const params = useParams();

  useEffect(() => {
    console.log("Params:", params.slug); // 값 확인
    async function fetchNewsDetail() {
      if (params.slug) {
        try {
          const res = await fetch(`/api/article/${params.slug}`);
          if (!res.ok) {
            throw new Error("No such article found");
          }
          const data = await res.json();
          setNewsInfo(data);
          
        } catch (err) {
          console.error(err);
        }
      }
    }

    fetchNewsDetail();
  }, [ params ]);

  return (
    <NewsletterDetailPageStyled>
      <TitleSection
        category={newsInfo?.categoryId}
        title={newsInfo?.title}
        date={dateFormatter(newsInfo?.createdAt)}
      />
      <div className="content-section">
      <Article
        content={newsInfo?.summary ? newsInfo.summary : ''}
      />
      </div>
    </NewsletterDetailPageStyled>
  );
}

const NewsletterDetailPageStyled = styled.div`
    margin: 2.5rem 0;
    height: 100%;
    width: 100%;
`;

export default NewsletterDetailPage;
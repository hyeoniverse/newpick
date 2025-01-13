"use client"

import styled from "styled-components";
import { useParams } from "next/navigation";
import TitleSection from "@/components/newsDetail/TitleSection";
import { useEffect, useState } from "react";
import { INewsDetail } from "@/models/newsDetail";
import { format } from "@/utills/dateformat";

function NewsletterDetailPage() {
  const [ newsInfo, setNewsInfo ] = useState<INewsDetail | null>(null)
  const params = useParams();

  useEffect(() => {
    console.log("Params:", typeof params.slug); // 값 확인
    async function fetchNewsDetail() {
      if (params.slug) {
        try {
          const res = await fetch(`/api/news/${params.slug}`);
          if (!res.ok) {
            throw new Error("No such news found");
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
        date={format(newsInfo?.createdAt)}
      />
    </NewsletterDetailPageStyled>
  );
}

const NewsletterDetailPageStyled = styled.div`
    margin: 2.5rem 0;
    
`;

export default NewsletterDetailPage;
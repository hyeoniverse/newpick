import React, { useState } from "react";
import { SUMMARYNEWS } from "@/constants/mypageData";

interface NewsletterDataProps {
  id: number;
  categoryName: string;
  userId?: number;
  createdAt: string;
  likes: number;
  img: string;
  title: string;
  summary: string;
}

const useMypage = () => {
  const [ selectCate, setSelectCate ] = useState<string[]>([]);
  const [ allSelectCate, setAllSelectCate ] = useState(false)

  const handleAnchorNavigation = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: "smooth", block: "start"});
    }
  };

  const handleSelectCate = (news: NewsletterDataProps) => {
    setSelectCate((prev) => {
      const isSelected = selectCate.includes(news.categoryName)
      let newSelectCate;

      if (!isSelected) {
        newSelectCate = [ ...prev, news.categoryName ];
      } else {
        newSelectCate = prev.filter((el) => el !== news.categoryName);
      }
      // 전체 카테고리와 길이가 같으면 전체 true, 아니면 false
      if (newSelectCate.length === SUMMARYNEWS.length) {
        setAllSelectCate(true);
      } else {
        setAllSelectCate(false);
      }

      return newSelectCate;
    })
  }

  const handleSelectAll = () => {

    if (selectCate.length < SUMMARYNEWS.length) {
      setSelectCate(SUMMARYNEWS.map((cate) => cate.categoryName));
      setAllSelectCate(true);
    } else if (selectCate.length === SUMMARYNEWS.length) {
      setSelectCate([])
      setAllSelectCate(false);
    }

  }

  return {
    handleAnchorNavigation,
    handleSelectCate,
    handleSelectAll,
    allSelectCate,
    selectCate
  }
};

export default useMypage;

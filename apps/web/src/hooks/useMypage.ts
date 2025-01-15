import React, { useState } from "react";
import { CATEGORY } from "@/constants/mypageData";

export interface INewsletterData {
  id: number;
  categoryName: string;
  userId?: number;
  createdAt: string;
  likes: number;
  img: string;
  title: string;
  summary: string;
}

export interface ICategories {
  id: number;
  category: string;
}

const useMypage = () => {
  const [ selectCate, setSelectCate ] = useState<string[]>([]);
  const [ allSelectCate, setAllSelectCate ] = useState(false)

  // 구독한 뉴스레터 네비게이션 스크롤 앵커 설정
  const handleAnchorNavigation = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({behavior: "smooth", block: "start"});
    }
  };

  // 뉴스레터 설정 카테고리 선택
  const handleSelectCate = (cate: ICategories) => {
    setSelectCate((prev) => {
      const isSelected = selectCate.includes(cate.category)
      let newSelectCate = [...prev]

      if (!isSelected) {
        newSelectCate = [ ...newSelectCate, cate.category ];
      } else {
        newSelectCate = prev.filter((el) => el !== cate.category);
      }

      // 전체 카테고리와 길이가 같으면 전체 true, 아니면 false
      if (newSelectCate.length === CATEGORY.length) {
        setAllSelectCate(true);
      } else {
        setAllSelectCate(false);
      }

      console.log('지금꺼', newSelectCate)

      return newSelectCate;
    })
  }

  // 뉴스레터 설정 카테고리 전체 선택
  const handleSelectAll = () => {

    if (selectCate.length === CATEGORY.length) {
      setSelectCate([])
      setAllSelectCate(false);
    } else {
      setSelectCate(CATEGORY.map((cate) => cate.category));
      setAllSelectCate(true);
    }
  }

  return {
    handleAnchorNavigation,
    handleSelectCate,
    handleSelectAll,
    allSelectCate,
    selectCate,
    setSelectCate,
  }
};

export default useMypage;

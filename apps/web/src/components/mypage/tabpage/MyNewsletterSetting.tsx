import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import Button from "@/components/common/Button";
import { useState } from "react";

interface NewsletterDataProps {
  id: number;
  categoryName: string;
  userId: number;
  createdAt: string;
  likes: number;
  img: string;
  title: string;
  summary: string;
}

function MyNewsletterSetting() {
  const [ selectCate, setSelectCate ] = useState<string[]>([]);

  const handleSelectCate = (news: NewsletterDataProps) => {
    const selectedCategory = selectCate.includes(news.categoryName)

    if (!selectedCategory) {
      setSelectCate([ news.categoryName, ...selectCate ]);
    } else {
      setSelectCate(selectCate.filter((el) => el !== news.categoryName))
    }
  }

  const handleSelectAll = (e) => {

    console.log(SUMMARYNEWS.length)
    if (e && selectCate.length !== SUMMARYNEWS.length) {
      setSelectCate(SUMMARYNEWS.map((cate) => cate.categoryName));
    } else {
      setSelectCate([])
    }

  }

  return (
    <MyNewsletterSettingStyled>
      <div className="text">
        <h3>뉴스레터 설정</h3>
        <p>
          선택된 카테고리를 재설정 해주신 후 완료 버튼을 눌러주세요.
          <br />
          내일 보내드리는 뉴스레터부터 적용됩니다.
        </p>
      </div>
      <ul className="categories">
        <li>
          <Button
            scheme="default"
            className="all-category category-btn"
            onClick={(e) => handleSelectAll(e)}
          >
            전체
          </Button>
        </li>
        {SUMMARYNEWS.map((news, index) =>
          <li key={index}>
            <Button
              scheme="default"
              onClick={() => {handleSelectCate(news)}}
              className={selectCate.includes(news.categoryName) ? "category-btn active" : "category-btn"}
            >
              {news.categoryName}
            </Button>
          </li>,
        )}
      </ul>
      <ul>
        {selectCate.map((cate, index) => (
          <li key={index}>
            {cate}
          </li>
        ))}
      </ul>
    </MyNewsletterSettingStyled>
  );
}

const MyNewsletterSettingStyled = styled.div`

    .categories {
        display: flex;
        flex-direction: row;
        gap: 0.25rem;

        .category-btn {
            width: max-content;
            color: ${({theme}) => theme.color.primary};
            border-radius: ${({theme}) => theme.borderRadius.capsule};
            border: 1px solid ${({theme}) => theme.color.primary};
        }

        .active {
            color: ${({theme}) => theme.color.background};
            background-color: ${({theme}) => theme.color.primary};
            border-radius: ${({theme}) => theme.borderRadius.capsule};
        }
    }

`;

export default MyNewsletterSetting;
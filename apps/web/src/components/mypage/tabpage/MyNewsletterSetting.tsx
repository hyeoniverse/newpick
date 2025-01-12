import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import Button from "@/components/common/Button";
import useMypage from "@/hooks/useMypage";


function MyNewsletterSetting() {
  const { handleSelectCate, handleSelectAll, allSelectCate, selectCate } = useMypage();

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
            className={allSelectCate ? "active category-btn" : "category-btn"}
            onClick={() => handleSelectAll()}
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
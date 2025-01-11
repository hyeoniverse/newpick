import styled from "styled-components";
import { SUMMARYNEWS } from "@/constants/mypageData";
import ThumbImg from "@/components/mypage/common(temporary)/ThumbImg";
import LikeIcon from "@/components/mypage/common(temporary)/LikeIcon";

function MyBookmark() {
  return (
    <>
      <MyBookmarkStyled>
        {SUMMARYNEWS.map((news, index) => (
          <div key={index} className="card">
            <ThumbImg src={news.img} />
            <div className="content">
              <p className="category">{news.categoryName}</p>
              <h3 className="title">{news.title}</h3>
              <p className="subtext">{news.summary}</p>
              <div className="etc">
                <LikeIcon />
                <div className="bar"></div>
                <div className="date">{news.createdAt}</div>
              </div>
            </div>
          </div>
        ))}
      </MyBookmarkStyled>
    </>
  );
}

const MyBookmarkStyled = styled.div`
    display: grid;
    justify-items: start;
    justify-content: start;
    gap: 3.75rem 2rem;
    
    grid-template-columns: repeat(3, 1fr);

    .card {
        width: 340px;


        .title, .subtext {
            width: 100%;

            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
        }

        .title {
            font-size: ${({theme}) => theme.fontSize.extraLarge};
        }

        .subtext {
            font-size: ${({theme}) => theme.fontSize.small};
            color: ${({theme}) => theme.color.subtext}
        }
    }
`;


export default MyBookmark;
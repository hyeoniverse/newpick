'use client'

import styled from "styled-components";
import { IoArrowBack } from "react-icons/io5";
import BookmarkIcon from "@/components/common/icons/BookmarkIcon";
import LinkCopyIcon from "@/components/common/icons/LinkCopyIcon";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MoveButton from "@/components/common/MoveButton";

interface TitleSectionProps {
  category?: number;
  title?: string;
  date?: string;
}

function TitleSection({title, date, category}: TitleSectionProps) {
  const router = useRouter();

  return (
    <TitleSectionStyled>
      <MoveButton onClick={() => router.back()} text="이전으로" frontIcon={<IoArrowBack/>}/>
      <div className="title-section">
        <Link href={'#'} className="category">{category}</Link>
        <h1 className="title">{title}</h1>
        <p className="date">{date}</p>
        <div className="icons">
          {/*<BookmarkIcon newsId={}/>*/}
          {/*<LinkCopyIcon />*/}
        </div>
      </div>
    </TitleSectionStyled>
  );
}

const TitleSectionStyled = styled.div`
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};

    .title-section {
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        margin: 1.25rem 0;

        .category {
            color: ${({theme}) => theme.color.primary};
            font-weight: ${({theme}) => theme.fontWeight.medium};
        }
        
        .title {
            word-break: auto-phrase;
        }
        
        .icons {
            display: flex;
            flex-direction: row;
            gap: 1rem;
            justify-content: center;
            align-items: center;
            margin-top: 0.75rem;
        }

        .date {
            color: ${({theme}) => theme.color.lightGrey};
            font-size: ${({theme}) => theme.fontSize.extraSmall};
        }
    }

`;

export default TitleSection;
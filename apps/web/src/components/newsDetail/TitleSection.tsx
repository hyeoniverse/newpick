import styled from "styled-components";
import Button from "@/components/common/Button";
import { IoArrowBack } from "react-icons/io5";
import LikeIcon from "@/components/mypage/common(temporary)/LikeIcon";
import LinkCopyIcon from "@/components/mypage/common(temporary)/LinkCopyIcon";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TitleSectionProps {
  category?: number;
  title?: string;
  date?: string;
}

function TitleSection({title, date, category}: TitleSectionProps) {
  const router = useRouter();

  return (
    <TitleSectionStyled>
      <Button className="prev-btn" scheme="monoOutline" onClick={() => router.back()}><IoArrowBack />이전으로</Button>
      <div className="title-section">
        <Link href={'#'} className="category">{category}</Link>
        <h1 className="title">{title}</h1>
        <p className="date">{date}</p>
        <div className="icons">
          <div className="bar"></div>
          <LikeIcon />
          <LinkCopyIcon />
        </div>
      </div>
    </TitleSectionStyled>
  );
}

const TitleSectionStyled = styled.div`

    display: flex;
    flex-direction: column;
    border-bottom: 1px solid ${({ theme }) => theme.color.border};
    
    .prev-btn {
        border-radius: ${({theme}) => theme.borderRadius.capsule};
        color: ${({theme}) => theme.color.subtext};
        width: 7rem;

        svg {
            color: ${({theme}) => theme.color.subtext};
        }
    }

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
        
        .icons {
            display: flex;
            flex-direction: row;
            gap: 0.5rem;
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